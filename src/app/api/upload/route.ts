import { NextRequest, NextResponse } from "next/server";
import { getNativeSuiConfig } from "@/lib/blobpass/ledger";
import { DEMO_SELLER_ADDRESS, suiToMist } from "@/lib/blobpass/format";
import { storeWalrusBlob } from "@/lib/blobpass/walrus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "name" in value &&
      "size" in value,
  );
}

function formString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assetFile = formData.get("asset");
    const previewFile = formData.get("preview");

    if (!isFile(assetFile)) {
      return NextResponse.json({ error: "Missing asset file" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const requestedStorageEpochs = Number.parseInt(formString(formData, "storageEpochs", "5"), 10);
    const rawUpload = await storeWalrusBlob({
      file: assetFile,
      visibility: "hidden",
      origin,
      storageEpochs: requestedStorageEpochs,
    });

    const previewUpload = isFile(previewFile)
      ? await storeWalrusBlob({
          file: previewFile,
          visibility: "public",
          origin,
          storageEpochs: requestedStorageEpochs,
        })
      : null;

    const title = formString(formData, "title", assetFile.name);
    const description = formString(
      formData,
      "description",
      "Token-gated digital asset stored on Walrus.",
    );
    const category = formString(formData, "category", "Digital Asset");
    const priceMist = suiToMist(formString(formData, "priceSui", "1"));
    const sellerAddress = formString(formData, "sellerAddress", DEMO_SELLER_ADDRESS);
    const fileHash = formString(formData, "fileHash");
    const storageEndEpoch = rawUpload.storageEndEpoch;

    return NextResponse.json({
      ok: true,
      success: true,
      source: rawUpload.source,
      previewBlobId: previewUpload?.blobId ?? null,
      rawFileBlobId: rawUpload.blobId,
      rawFileBlobObjectId: rawUpload.blobObjectId ?? null,
      previewUrl: previewUpload?.url ?? null,
      upload: {
        rawFile: rawUpload,
        preview: previewUpload,
      },
      asset: {
        title,
        description,
        category,
        priceMist,
        assetFilename: assetFile.name,
        sellerAddress,
        file_size: String(assetFile.size),
        file_type: assetFile.type || "application/octet-stream",
        fileHash,
        storageEpochs: rawUpload.storageEpochs,
        storageEndEpoch,
        storageEpochDurationDays: Number.parseInt(
          process.env.WALRUS_EPOCH_DURATION_DAYS ??
            process.env.NEXT_PUBLIC_WALRUS_EPOCH_DURATION_DAYS ??
            "14",
          10,
        ),
      },
      nativeSui: getNativeSuiConfig(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
