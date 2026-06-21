"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { suiToMist } from "@/lib/blobpass/format";
import {
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

const PREVIEW_MAX_DIM = 1200;
const PREVIEW_QUALITY = 0.85;

type PreviewMeta = {
  thumbDataUrl: string;
  originalBytes: number;
  resizedBytes: number;
  width: number;
  height: number;
};

/**
 * Auto-resize any uploaded preview image down to PREVIEW_MAX_DIM on the
 * longest edge and re-encode to JPEG at PREVIEW_QUALITY. Keeps Walrus
 * blob sizes small and consistent regardless of what the user picks.
 * Returns the new File ready for upload + a thumbnail data URL for UI.
 */
async function resizePreviewImage(file: File): Promise<{
  file: File;
  meta: PreviewMeta;
}> {
  const bitmap = await createImageBitmap(file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  const scale = Math.min(1, PREVIEW_MAX_DIM / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close?.();

  const mime = "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image resize failed"))),
      mime,
      PREVIEW_QUALITY,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "preview";
  const resized = new File([blob], `${baseName}.jpg`, {
    type: mime,
    lastModified: Date.now(),
  });

  return {
    file: resized,
    meta: {
      thumbDataUrl: canvas.toDataURL(mime, PREVIEW_QUALITY),
      originalBytes: file.size,
      resizedBytes: resized.size,
      width: dstW,
      height: dstH,
    },
  };
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

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
    editionSize?: number;
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
  { num: "01", label: "HASH" },
  { num: "02", label: "META" },
  { num: "03", label: "STORE" },
  { num: "04", label: "MINT" },
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

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_EOCD_MAX_SCAN = 65557;

function looksLikeZip(file: File) {
  if (file.type.includes("zip")) return true;
  return /\.zip$/i.test(file.name);
}

async function countZipEntries(file: File): Promise<number | null> {
  if (!looksLikeZip(file) || file.size < 22) return null;
  const tailLength = Math.min(ZIP_EOCD_MAX_SCAN, file.size);
  const tail = await file.slice(file.size - tailLength).arrayBuffer();
  const view = new DataView(tail);
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) !== ZIP_EOCD_SIGNATURE) continue;
    const totalEntries = view.getUint16(offset + 10, true);
    return totalEntries > 0 ? totalEntries : null;
  }
  return null;
}

export function UploadWorkflow() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function handlePreviewSelected(file: File | null) {
    setPreviewError(null);
    if (!file) {
      setPreviewFile(null);
      setPreviewMeta(null);
      return;
    }
    setPreviewBusy(true);
    try {
      const { file: resized, meta } = await resizePreviewImage(file);
      setPreviewFile(resized);
      setPreviewMeta(meta);
    } catch (error) {
      console.error("[blobpass] preview resize failed:", error);
      setPreviewFile(file);
      setPreviewMeta(null);
      setPreviewError("Could not resize — uploading original file.");
    } finally {
      setPreviewBusy(false);
    }
  }
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Digital Asset");
  const [priceSui, setPriceSui] = useState("1");
  const [storageEpochs, setStorageEpochs] = useState("5");
  const [editionSize, setEditionSize] = useState("1");
  const [editionAutoDetected, setEditionAutoDetected] = useState(false);
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
    if (status === "stored") return 3;
    if (status === "hashing" || hashStatus === "hashing") return 0;
    if (status === "uploading" || status === "signing" || status === "confirming") return 2;
    if (assetFile) return 1;
    return 0;
  }, [assetFile, hashStatus, status]);

  async function inspectFile(nextFile: File | null) {
    setAssetFile(nextFile);
    setFileHash("");
    setDuplicateMatch(null);
    setHashStatus("idle");
    setEditionSize("1");
    setEditionAutoDetected(false);
    if (!nextFile) return;
    setHashStatus("hashing");
    setError("");
    try {
      const detectedEntries = await countZipEntries(nextFile);
      if (detectedEntries && detectedEntries > 0) {
        setEditionSize(String(detectedEntries));
        setEditionAutoDetected(true);
      }
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
      if (!fileHash) setStatus("hashing");
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
        const pointerTxResult = await signAndExecute.mutateAsync({ transaction: pointerTx });
        setTxDigest(pointerTxResult.digest);
        setStatus("confirming");
        const pointerFinalized = await suiClient.waitForTransaction({
          digest: pointerTxResult.digest,
          options: { showEvents: true, showObjectChanges: true },
        });
        const pointerEvent = getAccessPointerMintedEvent(pointerFinalized);
        const pointerPassChange = getCreatedPassChange(pointerFinalized) || getTransferredPassChange(pointerFinalized);
        const pointerPassId =
          pointerEvent?.pass_id || (typeof pointerPassChange?.objectId === "string" ? pointerPassChange.objectId : "");
        const pointerResponse = await fetch("/api/access-pointer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileHash: digest,
            buyerAddress: account.address,
            royaltyMist: existingMatch.royaltyMist,
            transactionDigest: pointerTxResult.digest,
            passId: pointerPassId,
          }),
        });
        const pointerPayload = (await pointerResponse.json()) as
          | { pass: IndexedListingResponse["pass"]; error?: string }
          | { error?: string };
        if (!pointerResponse.ok || !("pass" in pointerPayload)) {
          throw new Error(pointerPayload.error || "BlobPass could not index the duplicate access pointer.");
        }
        setResponse({ ok: true, pass: pointerPayload.pass });
        setStatus("stored");
        return;
      }
      setStatus("uploading");
      const formData = new FormData();
      formData.append("asset", assetFile);
      if (previewFile) formData.append("preview", previewFile);
      formData.append("title", title || assetFile.name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("priceSui", priceSui);
      formData.append("sellerAddress", account.address);
      formData.append("fileHash", digest);
      formData.append("storageEpochs", storageEpochs);
      formData.append("editionSize", editionSize);
      const result = await fetch("/api/upload", { method: "POST", body: formData });
      const payload: unknown = await result.json();
      if (!result.ok) {
        throw new Error(
          payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "Upload failed",
        );
      }
      const uploadPayload = payload as UploadResponse;
      if (uploadPayload.source !== "walrus") {
        throw new Error(
          "Upload only persisted to this machine's local disk — the Walrus publisher returned no blob id, so the listing would be unreachable in production. Check that WALRUS_PUBLISHER_URL / WALRUS_AGGREGATOR_URL are set and the publisher is online, then retry.",
        );
      }
      const priceMist = uploadPayload.asset.priceMist || suiToMist(priceSui);
      const storageEpochCount = Math.max(1, Number.parseInt(storageEpochs, 10) || uploadPayload.asset.storageEpochs || 5);
      const totalSupplyCount = Math.max(1, Number.parseInt(editionSize, 10) || 1);
      if (!uploadPayload.nativeSui.configured) {
        throw new Error(
          `BlobPass on-chain registry is not configured. Missing: ${uploadPayload.nativeSui.missing.join(", ")}`,
        );
      }
      setStatus("signing");
      const transaction = buildCreateRegisteredListingTransaction({
        title: uploadPayload.asset.title,
        description: uploadPayload.asset.description,
        fileSize: uploadPayload.asset.file_size,
        fileType: uploadPayload.asset.file_type,
        previewImageUrl: uploadPayload.previewUrl ?? "",
        walrusBlobId: uploadPayload.rawFileBlobId,
        fileHashBytes: hashBytes,
        storageEpochs: storageEpochCount,
        totalSupply: totalSupplyCount,
        priceMist,
      });
      const txResult = await signAndExecute.mutateAsync({ transaction });
      setTxDigest(txResult.digest);
      setStatus("confirming");
      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: { showEvents: true, showObjectChanges: true },
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
          options: { showContent: true },
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
        headers: { "Content-Type": "application/json" },
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
          totalSupply: toNumber(blobRegisteredEvent?.total_supply, totalSupplyCount),
          passesMinted: toNumber(blobRegisteredEvent?.passes_minted, 1),
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

  const epochDays = Number.parseInt(storageEpochs, 10) * 14; // Walrus default — best-effort hint

  return (
    <section className="mt-14 space-y-12">
      {/* ───── Step indicator ───── */}
      <div className="grid grid-cols-4 gap-px bg-[var(--ink-16)]">
        {flow.map((step, index) => {
          const complete = index < activeStep || status === "stored";
          const active = index === activeStep && status !== "stored";
          return (
            <div className="bg-[var(--paper)] p-4" key={step.label}>
              <div className="mono flex items-baseline justify-between text-[10px] tracking-[0.18em]">
                <span style={{ color: active || complete ? "var(--signal-deep)" : "var(--ink-40)" }}>
                  {step.num}
                </span>
                <span style={{ color: complete ? "var(--signal-deep)" : active ? "var(--ink)" : "var(--ink-40)" }}>
                  {complete ? "DONE" : active ? "ACTIVE" : "—"}
                </span>
              </div>
              <div
                className="display mt-2 text-[20px]"
                style={{ color: active || complete ? "var(--ink)" : "var(--ink-40)" }}
              >
                {step.label}
              </div>
              <div
                className="mt-3 h-[2px] w-full"
                style={{
                  background: complete
                    ? "var(--signal)"
                    : active
                      ? "var(--ink)"
                      : "var(--ink-16)",
                }}
              />
            </div>
          );
        })}
      </div>

      <form className="space-y-12" onSubmit={submit}>
        {/* ───── 01 FILE ───── */}
        <Section num="01" label="FILE" hint="Drop the asset. SHA-256 happens locally before anything leaves the browser.">
          <label className="relative grid min-h-[180px] cursor-pointer place-items-center border border-dashed border-[var(--ink-40)] p-6 text-center transition-colors hover:border-[var(--signal)] md:min-h-[280px] md:p-10">
            <input
              className="sr-only"
              onChange={(event) => void inspectFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            {/* corner marks */}
            <span className="absolute left-0 top-0 h-4 w-4" style={{ borderTop: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
            <span className="absolute right-0 top-0 h-4 w-4" style={{ borderTop: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
            <span className="absolute bottom-0 left-0 h-4 w-4" style={{ borderBottom: "2px solid var(--ink)", borderLeft: "2px solid var(--ink)" }} />
            <span className="absolute bottom-0 right-0 h-4 w-4" style={{ borderBottom: "2px solid var(--ink)", borderRight: "2px solid var(--ink)" }} />
            <div>
              <div className="mono text-[10px] tracking-[0.24em] text-[var(--ink-40)]">
                [ DROP / CLICK ]
              </div>
              <div className="display mt-3 max-w-full truncate text-[clamp(18px,2.4vw,32px)]">
                {assetFile ? assetFile.name : "Select digital asset"}
              </div>
              <p className="mono mx-auto mt-4 max-w-md text-[12px] leading-7 text-[var(--ink-60)]">
                ZIP · PDF · MP4 · datasets · code archives · prompt packs · 3D models.
              </p>
            </div>
          </label>

          {assetFile ? (
            <div className="mt-6 grid gap-px bg-[var(--ink-16)] md:grid-cols-3">
              <Tile label="HASH STATUS" value={
                hashStatus === "hashing"
                  ? "HASHING…"
                  : duplicateMatch
                    ? "DUPLICATE FOUND"
                    : hashStatus === "checked"
                      ? "UNIQUE"
                      : "PENDING"
              } accent={duplicateMatch ? "warn" : hashStatus === "checked" ? "signal" : "muted"} />
              <Tile label="SHA-256" value={fileHash ? `${fileHash.slice(0, 14)}…` : "—"} mono />
              <Tile label="SIZE" value={`${(assetFile.size / 1024).toFixed(0)} KB`} mono />
            </div>
          ) : null}

          {duplicateMatch ? (
            <div className="mt-4 border border-[var(--ink)] bg-[var(--ink)] p-4 text-[var(--paper)]">
              <div className="mono mb-2 text-[10px] tracking-[0.18em]" style={{ color: "var(--signal)" }}>
                [ DUPLICATE ─ ROYALTY MODE ]
              </div>
              <p className="mono text-[12px] leading-7" style={{ color: "var(--paper-60)" }}>
                Existing Walrus blob {duplicateMatch.blobLabel} was uploaded by {duplicateMatch.originalUploaderLabel}.
                This upload will mint an access pointer and route {duplicateMatch.royaltySui} SUI as a storage royalty.
              </p>
            </div>
          ) : null}

          {/* Preview image — auto-resizes to ≤1200px JPEG before upload */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <div className="label">PUBLIC PREVIEW IMAGE</div>
              <input
                accept="image/*"
                className="input-box mt-2"
                disabled={previewBusy}
                onChange={(event) => handlePreviewSelected(event.target.files?.[0] ?? null)}
                type="file"
              />

              {/* Status block */}
              {previewBusy && (
                <div className="mono mt-3 text-[11px] tracking-[0.18em] text-[var(--signal-deep)]">
                  [ RESIZING · PLEASE WAIT ]
                </div>
              )}

              {previewError && !previewBusy && (
                <div className="mono mt-3 text-[11px] tracking-[0.18em] text-[var(--ink-60)]">
                  [ ! ] {previewError}
                </div>
              )}

              {previewMeta && !previewBusy && (
                <div className="mono mt-4 flex items-start gap-4">
                  {/* Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Resized preview"
                    className="border border-[var(--ink-40)]"
                    src={previewMeta.thumbDataUrl}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "cover",
                    }}
                  />
                  <div className="flex flex-col gap-1 text-[11px] tracking-[0.12em] text-[var(--ink-60)]">
                    <span style={{ color: "var(--signal-deep)" }}>
                      [ READY · {previewMeta.width}×{previewMeta.height} ]
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatBytes(previewMeta.originalBytes)} →{" "}
                      <span style={{ color: "var(--ink)" }}>
                        {formatBytes(previewMeta.resizedBytes)}
                      </span>
                    </span>
                    <span className="text-[var(--ink-40)]">
                      ENCODED · JPEG · Q{Math.round(PREVIEW_QUALITY * 100)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="mono text-[12px] leading-7 text-[var(--ink-60)]">
              The raw asset is stored as a hidden blob. The marketplace receives only
              the public metadata and preview image you provide here. Any image you
              pick is auto-resized to {PREVIEW_MAX_DIM}px on the longest edge — no
              giant uploads, no broken cards.
            </p>
          </div>
        </Section>

        {/* ───── 02 METADATA ───── */}
        <Section num="02" label="METADATA" hint="Title, description, and category appear on the public listing.">
          <div className="grid gap-8">
            <div>
              <div className="label">TITLE</div>
              <input
                className="input-underline mt-1"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Premium 3D Blender Pack"
                value={title}
              />
            </div>
            <div>
              <div className="label">DESCRIPTION</div>
              <textarea
                className="input-box mt-2 min-h-32"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="High-fidelity assets for rendering engines."
                value={description}
              />
            </div>
            <div>
              <div className="label">CATEGORY</div>
              <select
                className="input-box mt-2"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {["Digital Asset", "Datasets", "Video", "Source Code", "Documents", "AI Models"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ───── 03 PRICING ───── */}
        <Section num="03" label="PRICING" hint="Set in SUI. Buyers pay once; the pass is theirs permanently.">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="label">PRICE</div>
              <div className="mt-2 flex items-baseline gap-3 border-b border-[var(--ink-40)] focus-within:border-[var(--signal)] focus-within:border-b-2">
                <input
                  className="display tabular-nums w-full bg-transparent text-[40px] leading-none outline-none"
                  min="0"
                  onChange={(event) => setPriceSui(event.target.value)}
                  step="0.000000001"
                  type="number"
                  value={priceSui}
                />
                <span className="mono pb-2 text-[14px] tracking-[0.18em] text-[var(--ink-40)]">
                  SUI
                </span>
              </div>
            </div>
            <div className="mono text-[11px] leading-7 text-[var(--ink-60)]">
              ≈ {(Number.parseFloat(priceSui) * 1).toFixed(4)} SUI / pass
              <br />
              100% to seller wallet
            </div>
          </div>
        </Section>

        {/* ───── 04 STORAGE ───── */}
        {/* TODO(epochs-preset): convert to 3 preset cards (Short / Standard / Extended) per user request */}
        <Section
          num="04"
          label="STORAGE"
          hint="How long the blob is funded on Walrus before it must be topped up."
        >
          <div className="grid items-end gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <div className="label">EPOCHS</div>
              <div className="mt-2 flex items-baseline gap-3 border-b border-[var(--ink-40)] focus-within:border-[var(--signal)] focus-within:border-b-2">
                <input
                  className="display tabular-nums w-full bg-transparent text-[40px] leading-none outline-none"
                  min="1"
                  onChange={(event) => setStorageEpochs(event.target.value)}
                  step="1"
                  type="number"
                  value={storageEpochs}
                />
                <span className="mono pb-2 text-[14px] tracking-[0.18em] text-[var(--ink-40)]">
                  EPOCHS
                </span>
              </div>
            </div>
            <div className="mono text-[11px] leading-7 text-[var(--ink-60)]">
              ≈ {epochDays || 0} days of guaranteed storage
              <br />
              Can be extended any time via /library
            </div>
          </div>
        </Section>

        {/* ───── 05 EDITIONS ───── */}
        <Section
          num="05"
          label="EDITIONS"
          hint="How many copies of the access pass can exist. 1 = unique."
        >
          <div className="grid items-end gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <div className="label">TOTAL SUPPLY</div>
              <div className="mt-2 flex items-baseline gap-3 border-b border-[var(--ink-40)] focus-within:border-[var(--signal)] focus-within:border-b-2">
                <input
                  className="display tabular-nums w-full bg-transparent text-[40px] leading-none outline-none"
                  min="1"
                  onChange={(event) => {
                    setEditionSize(event.target.value);
                    setEditionAutoDetected(false);
                  }}
                  required
                  step="1"
                  type="number"
                  value={editionSize}
                />
                <span className="mono pb-2 text-[14px] tracking-[0.18em] text-[var(--ink-40)]">
                  EDITIONS
                </span>
              </div>
            </div>
            <div className="mono text-[11px] leading-7 text-[var(--ink-60)]">
              {editionAutoDetected
                ? `Auto-counted ${editionSize} entries from the ZIP. Edit if needed.`
                : "Each edition is an independent pass that can be transferred."}
            </div>
          </div>
        </Section>

        {/* ───── SUBMIT ───── */}
        <div className="ascii-rule" />
        <div className="grid gap-4">
          <button
            className="button-primary w-full"
            style={{ minHeight: 56, fontSize: 14, letterSpacing: "0.18em" }}
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
              ? "[ CHECKING REGISTRY... ]"
              : status === "uploading"
                ? "[ UPLOADING TO WALRUS... ]"
                : status === "signing"
                  ? "[ AWAITING WALLET SIGNATURE... ]"
                  : status === "confirming"
                    ? "[ CONFIRMING ON-CHAIN... ]"
                    : duplicateMatch
                      ? "[ MINT ACCESS POINTER ]"
                      : "[ STORE & LIST ASSET ]"}
          </button>

          {!account?.address ? (
            <p className="mono text-[12px] tracking-[0.04em]" style={{ color: "#d4a853" }}>
              ⚠ Connect a Sui wallet to stamp the seller address into the upload payload.
            </p>
          ) : null}

          {error ? (
            <p className="mono text-[12px]" style={{ color: "#c0392b" }}>
              ✗ {error}
            </p>
          ) : null}

          {response ? (
            <div className="border border-[var(--signal)] bg-[var(--paper)] p-6">
              <div className="mono mb-4 text-[11px] tracking-[0.18em]" style={{ color: "var(--signal-deep)" }}>
                [ ACCESS LIVE ─ TX BROADCAST ]
              </div>
              <dl className="mono grid gap-2 text-[12px]">
                <Row k="PASS" v={response.pass.id} />
                <Row k="LISTING" v={response.pass.listingId} />
                <Row k="BLOB" v={response.pass.content.fields.walrus_blob_id} />
                <Row k="TX" v={txDigest || "pending"} />
              </dl>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link className="button-primary flex-1 justify-center" href="/marketplace">
                  [ VIEW MARKETPLACE ]
                </Link>
                <Link className="button-secondary flex-1 justify-center" href="/library">
                  [ OPEN LIBRARY ]
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Section({
  num,
  label,
  hint,
  children,
}: {
  num: string;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--ink-40)] pt-6">
      <div className="mb-6 grid grid-cols-1 items-baseline gap-3 md:grid-cols-[auto_1fr_auto] md:gap-6">
        <span className="display text-[28px] leading-none md:text-[40px]">{num}.</span>
        <div>
          <h3 className="mono text-[14px] font-medium tracking-[0.18em]">{label}</h3>
          <p className="mono mt-1 text-[12px] leading-6 text-[var(--ink-60)]">{hint}</p>
        </div>
        <span className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)] md:text-right">
          [ {label} ]
        </span>
      </div>
      <div className="pl-0 md:pl-[64px]">{children}</div>
    </section>
  );
}

function Tile({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "signal" | "warn" | "muted";
}) {
  const color =
    accent === "signal" ? "var(--signal-deep)" : accent === "warn" ? "#d4a853" : "var(--ink)";
  return (
    <div className="bg-[var(--paper)] p-4">
      <div className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
        {label}
      </div>
      <div
        className={`mt-2 ${mono ? "mono" : "display"} text-[14px] tabular-nums`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-baseline gap-4 border-b border-[var(--ink-08)] pb-1">
      <dt className="text-[10px] tracking-[0.18em] text-[var(--ink-40)]">{k}</dt>
      <dd className="break-all text-[12px]">{v}</dd>
    </div>
  );
}
