import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { BlobVisibility, UploadReceipt } from "./types";

type StoreWalrusBlobInput = {
  file: File;
  visibility: BlobVisibility;
  origin?: string;
};

function getWalrusPublisherUrl() {
  return process.env.WALRUS_PUBLISHER_URL || process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || "";
}

function getWalrusAggregatorUrl() {
  return process.env.WALRUS_AGGREGATOR_URL || process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || "";
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
  origin,
}: StoreWalrusBlobInput): Promise<UploadReceipt> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = contentTypeFor(file);
  const publisher = getWalrusPublisherUrl();

  if (publisher) {
    try {
      const url = new URL("/v1/blobs", publisher);
      url.searchParams.set("epochs", process.env.WALRUS_STORAGE_EPOCHS ?? "5");

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: Buffer.from(bytes),
      });

      if (!response.ok) {
        throw new Error(`Walrus upload failed with HTTP ${response.status}`);
      }

      const payload: unknown = await response.json();
      const blobId = extractWalrusBlobId(payload);

      if (!blobId) {
        throw new Error("Walrus upload succeeded without a blob id");
      }

      return {
        blobId,
        url: walrusBlobUrl(blobId),
        filename: file.name,
        contentType,
        size: file.size,
        visibility,
        source: "walrus",
      };
    } catch {
      // Fall through to local persistence so the app remains usable offline.
    }
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
    url: `${origin ?? ""}/api/walrus/${encodeURIComponent(blobId)}`,
    filename: file.name,
    contentType,
    size: file.size,
    visibility,
    source: "local",
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
