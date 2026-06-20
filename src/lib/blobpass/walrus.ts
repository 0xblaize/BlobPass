import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { BlobVisibility, UploadReceipt } from "./types";

type StoreWalrusBlobInput = {
  file: File;
  visibility: BlobVisibility;
  origin?: string;
  storageEpochs?: number;
};

function getWalrusPublisherUrl() {
  return process.env.WALRUS_PUBLISHER_URL || process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || "";
}

function getWalrusAggregatorUrl() {
  return process.env.WALRUS_AGGREGATOR_URL || process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || "";
}

function getStorageEpochs() {
  const configured = Number.parseInt(process.env.WALRUS_STORAGE_EPOCHS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 5;
}

function extractWalrusBlobId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const newlyCreated = record.newlyCreated as Record<string, unknown> | undefined;
  const alreadyCertified = record.alreadyCertified as Record<string, unknown> | undefined;
  const blobObject = newlyCreated?.blobObject as Record<string, unknown> | undefined;
  const blobId = blobObject?.blobId ?? alreadyCertified?.blobId ?? record.blobId;

  return typeof blobId === "string" ? blobId : "";
}

function extractWalrusBlobObjectId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const newlyCreated = record.newlyCreated as Record<string, unknown> | undefined;
  const alreadyCertified = record.alreadyCertified as Record<string, unknown> | undefined;
  const blobObject = newlyCreated?.blobObject as Record<string, unknown> | undefined;
  const id = blobObject?.id ?? blobObject?.objectId ?? alreadyCertified?.blobObjectId ?? record.blobObjectId;

  if (typeof id === "string") {
    return id;
  }

  if (id && typeof id === "object" && "id" in id && typeof (id as Record<string, unknown>).id === "string") {
    return String((id as Record<string, unknown>).id);
  }

  return "";
}

function extractWalrusStorageEndEpoch(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const newlyCreated = record.newlyCreated as Record<string, unknown> | undefined;
  const alreadyCertified = record.alreadyCertified as Record<string, unknown> | undefined;
  const blobObject = newlyCreated?.blobObject as Record<string, unknown> | undefined;
  const candidate =
    blobObject?.storageEndEpoch ??
    blobObject?.endEpoch ??
    alreadyCertified?.storageEndEpoch ??
    alreadyCertified?.endEpoch ??
    record.storageEndEpoch ??
    record.endEpoch;
  const parsed = typeof candidate === "string" ? Number.parseInt(candidate, 10) : candidate;

  return Number.isFinite(parsed) ? Number(parsed) : undefined;
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return arrayBuffer;
}

function contentTypeFor(file: File) {
  return file.type || "application/octet-stream";
}

type LocalBlobRecord = {
  blobId: string;
  contentType: string;
  filename: string;
  visibility: BlobVisibility;
};

const LOCAL_BLOB_DIR = path.join(process.cwd(), ".blobpass", "blobs");

async function ensureLocalBlobDir() {
  await mkdir(LOCAL_BLOB_DIR, { recursive: true });
}

function localBlobPath(blobId: string) {
  return path.join(LOCAL_BLOB_DIR, `${blobId}.bin`);
}

function localBlobMetaPath(blobId: string) {
  return path.join(LOCAL_BLOB_DIR, `${blobId}.json`);
}

async function setLocalBlob(
  blobId: string,
  bytes: Uint8Array,
  meta: Omit<LocalBlobRecord, "blobId">,
) {
  await ensureLocalBlobDir();
  await writeFile(localBlobPath(blobId), Buffer.from(bytes));
  await writeFile(
    localBlobMetaPath(blobId),
    JSON.stringify(
      {
        blobId,
        ...meta,
      } satisfies LocalBlobRecord,
      null,
      2,
    ),
    "utf8",
  );
}

async function getLocalBlob(blobId: string) {
  try {
    const [bytes, meta] = await Promise.all([
      readFile(localBlobPath(blobId)),
      readFile(localBlobMetaPath(blobId), "utf8"),
    ]);

    return {
      bytes: new Uint8Array(bytes),
      meta: JSON.parse(meta) as LocalBlobRecord,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function walrusBlobUrl(blobId: string) {
  const aggregator = getWalrusAggregatorUrl();

  if (!aggregator) {
    return "";
  }

  return `${aggregator.replace(/\/$/, "")}/v1/blobs/${encodeURIComponent(blobId)}`;
}

export async function storeWalrusBlob({
  file,
  visibility,
  origin: _origin,
  storageEpochs: requestedStorageEpochs,
}: StoreWalrusBlobInput): Promise<UploadReceipt> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = contentTypeFor(file);
  const publisher = getWalrusPublisherUrl();
  const isProduction = process.env.NODE_ENV === "production";
  const storageEpochs =
    Number.isFinite(requestedStorageEpochs) && requestedStorageEpochs && requestedStorageEpochs > 0
      ? requestedStorageEpochs
      : getStorageEpochs();

  if (publisher) {
    const url = new URL("/v1/blobs", publisher);
    url.searchParams.set("epochs", String(storageEpochs));

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: Buffer.from(bytes),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Walrus publisher rejected upload (HTTP ${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }

    const payload: unknown = await response.json();
    const blobId = extractWalrusBlobId(payload);
    const blobObjectId = extractWalrusBlobObjectId(payload);

    if (!blobId) {
      throw new Error("Walrus publisher returned no blob id");
    }

    return {
      blobId,
      blobObjectId,
      url: walrusBlobUrl(blobId) || `/api/walrus/${encodeURIComponent(blobId)}`,
      filename: file.name,
      contentType,
      size: file.size,
      visibility,
      source: "walrus",
      storageEpochs,
      storageEndEpoch: extractWalrusStorageEndEpoch(payload),
    };
  }

  if (isProduction) {
    throw new Error(
      "Walrus publisher is not configured. Set WALRUS_PUBLISHER_URL (and WALRUS_AGGREGATOR_URL) before uploading in production — local-disk fallback would not be reachable across replicas.",
    );
  }

  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
  const blobId = `local_${visibility}_${digest}`;
  await setLocalBlob(blobId, bytes, {
    contentType,
    filename: file.name,
    visibility,
  });

  return {
    blobId,
    url: `/api/walrus/${encodeURIComponent(blobId)}`,
    filename: file.name,
    contentType,
    size: file.size,
    visibility,
    source: "local",
    storageEpochs,
  };
}

export async function getPublicLocalWalrusBlob(blobId: string) {
  const blob = await getLocalBlob(blobId);

  if (!blob || blob.meta.visibility !== "public") {
    return null;
  }

  return new Response(bytesToArrayBuffer(blob.bytes), {
    headers: {
      "Content-Type": blob.meta.contentType,
    },
  });
}

export async function readProtectedWalrusBlob(blobId: string) {
  const localBlob = await getLocalBlob(blobId);

  if (localBlob) {
    return new Response(bytesToArrayBuffer(localBlob.bytes), {
      headers: {
        "Content-Type": localBlob.meta.contentType,
        "Content-Length": String(localBlob.bytes.byteLength),
      },
    });
  }

  const aggregator = getWalrusAggregatorUrl();

  if (aggregator) {
    const response = await fetch(
      `${aggregator.replace(/\/$/, "")}/v1/blobs/${encodeURIComponent(blobId)}`,
    );

    if (!response.ok) {
      throw new Error(`Walrus download failed with HTTP ${response.status}`);
    }

    return response;
  }

  return new Response(
    [
      "BlobPass demo payload",
      `Walrus blob: ${blobId}`,
      "Replace WALRUS_AGGREGATOR_URL or NEXT_PUBLIC_WALRUS_AGGREGATOR to stream the real protected object.",
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
