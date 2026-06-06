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
  extractPassIdFromListingObject,
  getCreatedListingChange,
  getCreatedPassChange,
  getInitialSharedVersionFromChange,
  getListingCreatedEvent,
} from "@/lib/blobpass/sui";
import type { UploadReceipt } from "@/lib/blobpass/types";

type UploadResponse = {
  success: true;
  ok: true;
  source: UploadReceipt["source"];
  previewBlobId: string | null;
  rawFileBlobId: string;
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
  };
  nativeSui: {
    configured: boolean;
    missing: string[];
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
  { label: "Upload", icon: Upload },
  { label: "Metadata", icon: FileText },
  { label: "Walrus Store", icon: Database },
  { label: "Mint & List", icon: CheckCircle },
];

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
  const [status, setStatus] = useState<
    "idle" | "uploading" | "signing" | "confirming" | "stored" | "error"
  >("idle");
  const [response, setResponse] = useState<IndexedListingResponse | null>(null);
  const [txDigest, setTxDigest] = useState("");
  const [error, setError] = useState("");

  const activeStep = useMemo(() => {
    if (status === "stored") {
      return 3;
    }

    if (status === "uploading" || status === "signing" || status === "confirming") {
      return 2;
    }

    if (assetFile) {
      return 1;
    }

    return 0;
  }, [assetFile, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!account?.address) {
      setError("Connect a Sui wallet before uploading a protected asset.");
      return;
    }

    if (!assetFile) {
      setError("Select an asset file first.");
      return;
    }

    setStatus("uploading");
    setError("");
    setResponse(null);
    setTxDigest("");

    const formData = new FormData();
    formData.append("asset", assetFile);

    if (previewFile) {
      formData.append("preview", previewFile);
    }

    formData.append("title", title || assetFile.name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("priceSui", priceSui);
    formData.append("sellerAddress", account?.address ?? "");

    try {
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

      setStatus("signing");

      const transaction = buildCreateListingTransaction({
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
                onChange={(event) => setAssetFile(event.target.files?.[0] ?? null)}
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

            <div className="grid gap-5 md:grid-cols-2">
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
            </div>

            <button
              className="button-primary min-h-14 w-full text-base"
              disabled={status === "uploading" || status === "signing" || status === "confirming"}
              type="submit"
            >
              {status === "uploading"
                ? "Uploading..."
                : status === "signing"
                  ? "Awaiting Wallet Signature..."
                  : status === "confirming"
                    ? "Confirming On-Chain..."
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
                <div className="mb-3 font-black text-cyan-300">Listing Live</div>
                <div className="grid gap-2">
                  <span>Pass: {response.pass.id}</span>
                  <span>Listing: {response.pass.listingId}</span>
                  <span>Hidden blob: {response.pass.content.fields.walrus_blob_id}</span>
                  <span>Transaction: {txDigest || "pending"}</span>
                </div>
                <p className="mt-4 leading-6 text-zinc-300">
                  The file is stored, the access pass is minted on Sui, and the marketplace cache has been updated with the real on-chain IDs.
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
