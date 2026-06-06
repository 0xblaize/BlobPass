import { NextRequest, NextResponse } from "next/server";
import { createAccessPassListing, getNativeSuiConfig } from "@/lib/blobpass/ledger";
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
    const rawUpload = await storeWalrusBlob({
      file: assetFile,
      visibility: "hidden",
      origin,
    });

    const previewUpload = isFile(previewFile)
      ? await storeWalrusBlob({
          file: previewFile,
          visibility: "public",
          origin,
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

    const { pass, listing, transaction } = await createAccessPassListing({
      sellerAddress,
      title,
      description,
      category,
      priceMist,
      assetFilename: assetFile.name,
      storageSource: rawUpload.source === "walrus" ? "walrus" : "local",
      fields: {
        title,
        description,
        file_size: String(assetFile.size),
        file_type: assetFile.type || "application/octet-stream",
        preview_image_url: previewUpload?.url ?? "",
        walrus_blob_id: rawUpload.blobId,
      },
    });

    return NextResponse.json({
      ok: true,
      success: true,
      source: rawUpload.source,
      previewBlobId: previewUpload?.blobId ?? null,
      rawFileBlobId: rawUpload.blobId,
      previewUrl: previewUpload?.url ?? null,
      upload: {
        rawFile: rawUpload,
        preview: previewUpload,
      },
      passDraft: pass,
      listing,
      transaction,
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
