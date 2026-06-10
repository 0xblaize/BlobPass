"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  ArrowRight,
  CheckCircle,
  Database,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { suiToMist } from "@/lib/blobpass/format";
import {
  buildCreateListingTransaction,
  buildCreateRegisteredListingTransaction,
  buildMintAccessPointerTransaction,
  extractPassIdFromListingObject,
  getAccessPointerMintedEvent,
  getBlobRegisteredEvent,
  getCreatedListingChange,
  getCreatedPassChange,
  getInitialSharedVersionFromChange,
  getListingCreatedEvent,
  getTransferredPassChange,
} from "@/lib/blobpass/sui";
import type { UploadReceipt } from "@/lib/blobpass/types";

type UploadResponse = {
  success: true;
  ok: true;
  source: UploadReceipt["source"];
  previewBlobId: string | null;
  rawFileBlobId: string;
  rawFileBlobObjectId: string | null;
  previewUrl: string | null;
  upload: {
    rawFile: UploadReceipt;
    preview: UploadReceipt | null;
  };
  asset: {
    title: string;
    description: string;
    category: string;
    priceMist: string;
    assetFilename: string;
    sellerAddress: string;
    file_size: string;
    file_type: string;
    fileHash: string;
    storageEpochs: number;
    storageEndEpoch?: number;
    storageEpochDurationDays: number;
  };
  nativeSui: {
    configured: boolean;
    missing: string[];
  };
};

type HashCheckResponse = {
  ok: true;
  exists: boolean;
  match?: {
    passId: string;
    listingId: string;
    title: string;
    blobId: string;
    blobLabel: string;
    originalUploader: string;
    originalUploaderLabel: string;
    royaltyBps: number;
    royaltyMist: string;
    royaltySui: string;
    storageEndEpoch: number;
    storageEpochDurationDays: number;
  };
};

type IndexedListingResponse = {
  ok: true;
  pass: {
    id: string;
    listingId: string;
    listingInitialSharedVersion?: string;
    content: {
      fields: {
        walrus_blob_id: string;
      };
    };
  };
};

const flow = [
  { label: "Hash", icon: ShieldCheck },
  { label: "Metadata", icon: FileText },
  { label: "Walrus Store", icon: Database },
  { label: "Mint & List", icon: CheckCircle },
];

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const normalized = value.trim().replace(/^0x/i, "");
  const bytes: number[] = [];

  for (let index = 0; index < normalized.length; index += 2) {
    bytes.push(Number.parseInt(normalized.slice(index, index + 2), 16));
  }

  return bytes;
}

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return bytesToHex(new Uint8Array(digest));
}

function toNumber(value: string | number | undefined, fallback = 0) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

export function UploadWorkflow() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Digital Asset");
  const [priceSui, setPriceSui] = useState("1");
  const [storageEpochs, setStorageEpochs] = useState("5");
  const [fileHash, setFileHash] = useState("");
  const [hashStatus, setHashStatus] = useState<"idle" | "hashing" | "checked" | "error">("idle");
  const [duplicateMatch, setDuplicateMatch] = useState<HashCheckResponse["match"] | null>(null);
  const [status, setStatus] = useState<
    "idle" | "hashing" | "uploading" | "signing" | "confirming" | "stored" | "error"
  >("idle");
  const [response, setResponse] = useState<IndexedListingResponse | null>(null);
  const [txDigest, setTxDigest] = useState("");
  const [error, setError] = useState("");

  const activeStep = useMemo(() => {
    if (status === "stored") {
      return 3;
    }

    if (status === "hashing" || hashStatus === "hashing") {
      return 0;
    }

    if (status === "uploading" || status === "signing" || status === "confirming") {
      return 2;
    }

    if (assetFile) {
      return 1;
    }

    return 0;
  }, [assetFile, hashStatus, status]);

  async function inspectFile(nextFile: File | null) {
    setAssetFile(nextFile);
    setFileHash("");
    setDuplicateMatch(null);
    setHashStatus("idle");

    if (!nextFile) {
      return;
    }

    setHashStatus("hashing");
    setError("");

    try {
      const digest = await hashFile(nextFile);
      setFileHash(digest);

      const response = await fetch(`/api/hash-check?fileHash=${encodeURIComponent(digest)}`);
      const payload = (await response.json()) as HashCheckResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Hash registry check failed");
      }

      if ("exists" in payload && payload.exists) {
        setDuplicateMatch(payload.match ?? null);
      }

      setHashStatus("checked");
    } catch (hashError) {
      setHashStatus("error");
      setError(hashError instanceof Error ? hashError.message : "Could not hash file");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!account?.address) {
      setError("Connect a Sui wallet before storing or minting access.");
      return;
    }

    if (!assetFile) {
      setError("Select an asset file first.");
      return;
    }

    setError("");
    setResponse(null);
    setTxDigest("");

    try {
      if (!fileHash) {
        setStatus("hashing");
      }

      const digest = fileHash || (await hashFile(assetFile));
      const hashBytes = hexToBytes(digest);
      setFileHash(digest);
      let existingMatch = duplicateMatch;

      if (!existingMatch) {
        const hashResponse = await fetch(`/api/hash-check?fileHash=${encodeURIComponent(digest)}`);
        const hashPayload = (await hashResponse.json()) as HashCheckResponse | { error?: string };

        if (!hashResponse.ok) {
          throw new Error(
            "error" in hashPayload && hashPayload.error ? hashPayload.error : "Hash registry check failed",
          );
        }

        if ("exists" in hashPayload && hashPayload.exists && hashPayload.match) {
          existingMatch = hashPayload.match;
          setDuplicateMatch(hashPayload.match);
        }
      }

      if (existingMatch) {
        setStatus("signing");

        const pointerTx = buildMintAccessPointerTransaction({
          fileHashBytes: hashBytes,
          royaltyMist: existingMatch.royaltyMist,
        });

        const pointerTxResult = await signAndExecute.mutateAsync({
          transaction: pointerTx,
        });

        setTxDigest(pointerTxResult.digest);
        setStatus("confirming");

        const pointerFinalized = await suiClient.waitForTransaction({
          digest: pointerTxResult.digest,
          options: {
            showEvents: true,
            showObjectChanges: true,
          },
        });

        const pointerEvent = getAccessPointerMintedEvent(pointerFinalized);
        const pointerPassChange = getCreatedPassChange(pointerFinalized) || getTransferredPassChange(pointerFinalized);
        const pointerPassId =
          pointerEvent?.pass_id || (typeof pointerPassChange?.objectId === "string" ? pointerPassChange.objectId : "");

        const pointerResponse = await fetch("/api/access-pointer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileHash: digest,
            buyerAddress: account.address,
            royaltyMist: existingMatch.royaltyMist,
            transactionDigest: pointerTxResult.digest,
            passId: pointerPassId,
          }),
        });

        const pointerPayload = (await pointerResponse.json()) as
          | {
              pass: IndexedListingResponse["pass"];
              error?: string;
            }
          | { error?: string };

        if (!pointerResponse.ok || !("pass" in pointerPayload)) {
          throw new Error(pointerPayload.error || "BlobPass could not index the duplicate access pointer.");
        }

        setResponse({
          ok: true,
          pass: pointerPayload.pass,
        });
        setStatus("stored");
        return;
      }

      setStatus("uploading");

      const formData = new FormData();
      formData.append("asset", assetFile);

      if (previewFile) {
        formData.append("preview", previewFile);
      }

      formData.append("title", title || assetFile.name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("priceSui", priceSui);
      formData.append("sellerAddress", account.address);
      formData.append("fileHash", digest);
      formData.append("storageEpochs", storageEpochs);

      const result = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload: unknown = await result.json();

      if (!result.ok) {
        throw new Error(
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Upload failed",
        );
      }

      const uploadPayload = payload as UploadResponse;
      const priceMist = uploadPayload.asset.priceMist || suiToMist(priceSui);
      const storageEpochCount = Math.max(1, Number.parseInt(storageEpochs, 10) || uploadPayload.asset.storageEpochs || 5);
      const useRegisteredRegistry = uploadPayload.nativeSui.configured;

      setStatus("signing");

      const transaction = useRegisteredRegistry
        ? buildCreateRegisteredListingTransaction({
            title: uploadPayload.asset.title,
            description: uploadPayload.asset.description,
            fileSize: uploadPayload.asset.file_size,
            fileType: uploadPayload.asset.file_type,
            previewImageUrl: uploadPayload.previewUrl ?? "",
            walrusBlobId: uploadPayload.rawFileBlobId,
            fileHashBytes: hashBytes,
            storageEpochs: storageEpochCount,
            priceMist,
          })
        : buildCreateListingTransaction({
            title: uploadPayload.asset.title,
            description: uploadPayload.asset.description,
            fileSize: uploadPayload.asset.file_size,
            fileType: uploadPayload.asset.file_type,
            previewImageUrl: uploadPayload.previewUrl ?? "",
            walrusBlobId: uploadPayload.rawFileBlobId,
            priceMist,
          });

      const txResult = await signAndExecute.mutateAsync({
        transaction,
      });

      setTxDigest(txResult.digest);
      setStatus("confirming");

      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const createdEvent = getListingCreatedEvent(finalized);
      const blobRegisteredEvent = getBlobRegisteredEvent(finalized);
      const listingChange = getCreatedListingChange(finalized);
      const passChange = getCreatedPassChange(finalized);
      const listingId =
        createdEvent?.listing_id || (typeof listingChange?.objectId === "string" ? listingChange.objectId : "");
      let passId =
        createdEvent?.pass_id || (typeof passChange?.objectId === "string" ? passChange.objectId : "");
      const listingInitialSharedVersion = getInitialSharedVersionFromChange(listingChange);

      if (!passId && listingId) {
        const listingObject = await suiClient.getObject({
          id: listingId,
          options: {
            showContent: true,
          },
        });

        passId = extractPassIdFromListingObject(listingObject);
      }

      if (!listingId || !passId) {
        throw new Error(
          "The listing transaction succeeded, but BlobPass could not read the created listing or pass IDs.",
        );
      }

      const indexResponse = await fetch("/api/index-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerAddress: account.address,
          title: uploadPayload.asset.title,
          description: uploadPayload.asset.description,
          category,
          priceMist,
          assetFilename: uploadPayload.asset.assetFilename,
          storageSource: uploadPayload.source === "walrus" ? "walrus" : "local",
          passId,
          listingId,
          listingInitialSharedVersion,
          transactionDigest: txResult.digest,
          blobObjectId: blobRegisteredEvent?.blob_object_id || uploadPayload.rawFileBlobObjectId || "",
          fileHash: digest,
          storageStartEpoch: toNumber(blobRegisteredEvent?.storage_start_epoch, 0),
          storageEndEpoch: toNumber(
            blobRegisteredEvent?.storage_end_epoch,
            uploadPayload.asset.storageEndEpoch || storageEpochCount,
          ),
          storageEpochDurationDays: uploadPayload.asset.storageEpochDurationDays,
          originalUploader: account.address,
          royaltyBps: toNumber(blobRegisteredEvent?.royalty_bps, 500),
          fields: {
            title: uploadPayload.asset.title,
            description: uploadPayload.asset.description,
            file_size: uploadPayload.asset.file_size,
            file_type: uploadPayload.asset.file_type,
            preview_image_url: uploadPayload.previewUrl ?? "",
            walrus_blob_id: uploadPayload.rawFileBlobId,
          },
        }),
      });

      const indexedPayload = (await indexResponse.json()) as IndexedListingResponse | { error?: string };

      if (!indexResponse.ok) {
        throw new Error(
          "error" in indexedPayload && indexedPayload.error
            ? indexedPayload.error
            : "BlobPass could not index the on-chain listing.",
        );
      }

      setResponse(indexedPayload as IndexedListingResponse);
      setStatus("stored");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto mt-14 max-w-5xl space-y-10">
      <div className="grid gap-4 md:grid-cols-4">
        {flow.map((step, index) => {
          const Icon = step.icon;
          const complete = index < activeStep || status === "stored";
          const active = index === activeStep && status !== "stored";

          return (
            <div className="relative text-center" key={step.label}>
              <div
                className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${
                  complete || active
                    ? "border-cyan-300 bg-cyan-300/12 text-cyan-300"
                    : "border-white/20 bg-black text-zinc-400"
                }`}
              >
                <Icon size={22} />
              </div>
              <div
                className={`mt-4 text-sm font-black uppercase ${
                  complete || active ? "text-cyan-300" : "text-zinc-400"
                }`}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <form className="panel rounded-xl" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-white/10 p-8">
          <div>
            <h2 className="title text-2xl">Create Access Pass</h2>
            <p className="mt-2 text-zinc-400">
              Store the asset, publish the preview, and register a live marketplace listing.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-300">
            {activeStep + 1}
          </div>
        </div>

        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <label className="grid min-h-[240px] cursor-pointer place-items-center rounded-xl border border-dashed border-white/18 bg-white/[0.02] p-8 text-center hover:border-cyan-300/60">
              <input
                className="sr-only"
                onChange={(event) => void inspectFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <div>
                <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full bg-cyan-300/12 text-cyan-300">
                  <Upload size={34} />
                </div>
                <h3 className="title text-2xl">{assetFile ? assetFile.name : "Select Digital Asset"}</h3>
                <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-400">
                  ZIP, PDF, MP4, datasets, code archives, prompt packs, and 3D models.
                </p>
              </div>
            </label>

            {assetFile ? (
              <div className="rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm text-zinc-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-black text-cyan-300">
                    {hashStatus === "hashing"
                      ? "Hashing File..."
                      : duplicateMatch
                        ? "Duplicate Blob Found"
                        : hashStatus === "checked"
                          ? "Unique Blob Candidate"
                          : "Hash Pending"}
                  </span>
                  {fileHash ? <span className="mono text-xs text-zinc-500">{fileHash.slice(0, 18)}...</span> : null}
                </div>
                {duplicateMatch ? (
                  <p className="mt-3 leading-6 text-zinc-400">
                    Existing Walrus blob {duplicateMatch.blobLabel} was uploaded by{" "}
                    {duplicateMatch.originalUploaderLabel}. This upload will mint an access pointer and route{" "}
                    {duplicateMatch.royaltySui} SUI as a storage royalty.
                  </p>
                ) : (
                  <p className="mt-3 leading-6 text-zinc-400">
                    BlobPass checks SHA-256 locally before uploading, so duplicate assets can reuse existing storage.
                  </p>
                )}
              </div>
            ) : null}

            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Public Preview Image
              <input
                accept="image/*"
                className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-zinc-300"
                onChange={(event) => setPreviewFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <div className="flex gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm leading-6 text-zinc-400">
              <ShieldCheck className="shrink-0 text-cyan-300" size={22} />
              <p>
                The raw asset is stored as a hidden blob. The marketplace receives only public metadata and preview data.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Title
              <input
                className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Premium 3D Blender Pack"
                value={title}
              />
            </label>

            <label className="grid gap-3 text-sm font-bold text-zinc-300">
              Description
              <textarea
                className="min-h-32 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="High-fidelity assets for rendering engines."
                value={description}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-3 text-sm font-bold text-zinc-300">
                Category
                <select
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  {["Digital Asset", "Datasets", "Video", "Source Code", "Documents", "AI Models"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-3 text-sm font-bold text-zinc-300">
                Price
                <input
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                  min="0"
                  onChange={(event) => setPriceSui(event.target.value)}
                  step="0.000000001"
                  type="number"
                  value={priceSui}
                />
              </label>

              <label className="grid gap-3 text-sm font-bold text-zinc-300">
                Epochs
                <input
                  className="rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                  min="1"
                  onChange={(event) => setStorageEpochs(event.target.value)}
                  step="1"
                  type="number"
                  value={storageEpochs}
                />
              </label>
            </div>

            <button
              className="button-primary min-h-14 w-full text-base"
              disabled={
                status === "hashing" ||
                hashStatus === "hashing" ||
                status === "uploading" ||
                status === "signing" ||
                status === "confirming"
              }
              type="submit"
            >
              {status === "hashing" || hashStatus === "hashing"
                ? "Checking Registry..."
                : status === "uploading"
                ? "Uploading..."
                : status === "signing"
                  ? "Awaiting Wallet Signature..."
                  : status === "confirming"
                    ? "Confirming On-Chain..."
                    : duplicateMatch
                      ? "Mint Access Pointer"
                      : "Store & List Asset"}
              <ArrowRight size={20} />
            </button>

            {!account?.address ? (
              <p className="text-sm font-bold text-amber-300">
                Connect a Sui wallet to stamp the seller address into the upload payload.
              </p>
            ) : null}

            {error ? <p className="text-sm font-bold text-red-300">{error}</p> : null}

            {response ? (
              <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/8 p-5 text-sm text-zinc-300">
                <div className="mb-3 font-black text-cyan-300">Access Live</div>
                <div className="grid gap-2">
                  <span>Pass: {response.pass.id}</span>
                  <span>Listing: {response.pass.listingId}</span>
                  <span>Hidden blob: {response.pass.content.fields.walrus_blob_id}</span>
                  <span>Transaction: {txDigest || "pending"}</span>
                </div>
                <p className="mt-4 leading-6 text-zinc-300">
                  The asset lifecycle is recorded, the access object is minted on Sui, and the local mirror has been updated with the on-chain IDs.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link className="button-primary min-h-11 flex-1 justify-center" href="/marketplace">
                    View Marketplace
                  </Link>
                  <Link className="button-secondary min-h-11 flex-1 justify-center" href="/library">
                    Open My Library
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  );
}
