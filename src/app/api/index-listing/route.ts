import { NextRequest, NextResponse } from "next/server";
import { indexAccessPassListing } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IndexListingBody = {
  sellerAddress?: string;
  title?: string;
  description?: string;
  category?: string;
  priceMist?: string;
  assetFilename?: string;
  storageSource?: "local" | "walrus";
  passId?: string;
  listingId?: string;
  listingInitialSharedVersion?: string;
  blobObjectId?: string;
  fileHash?: string;
  storageStartEpoch?: number;
  storageEndEpoch?: number;
  storageEpochDurationDays?: number;
  originalUploader?: string;
  royaltyBps?: number;
  totalSupply?: number;
  passesMinted?: number;
  transactionDigest?: string;
  fields?: {
    title?: string;
    description?: string;
    file_size?: string;
    file_type?: string;
    preview_image_url?: string;
    walrus_blob_id?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IndexListingBody;

    if (
      !body.passId ||
      !body.listingId ||
      !body.title ||
      !body.category ||
      !body.priceMist ||
      !body.assetFilename ||
      !body.storageSource ||
      !body.fields?.title ||
      !body.fields.description ||
      !body.fields.file_size ||
      !body.fields.file_type ||
      !body.fields.walrus_blob_id
    ) {
      return NextResponse.json({ error: "Incomplete listing index payload" }, { status: 400 });
    }

    const indexed = await indexAccessPassListing({
      sellerAddress: body.sellerAddress,
      title: body.title,
      description: body.description || body.fields.description,
      category: body.category,
      priceMist: body.priceMist,
      assetFilename: body.assetFilename,
      storageSource: body.storageSource,
      passId: body.passId,
      listingId: body.listingId,
      listingInitialSharedVersion: body.listingInitialSharedVersion,
      blobObjectId: body.blobObjectId,
      fileHash: body.fileHash,
      storageStartEpoch: body.storageStartEpoch,
      storageEndEpoch: body.storageEndEpoch,
      storageEpochDurationDays: body.storageEpochDurationDays,
      originalUploader: body.originalUploader,
      royaltyBps: body.royaltyBps,
      totalSupply: body.totalSupply,
      passesMinted: body.passesMinted,
      transactionDigest: body.transactionDigest,
      fields: {
        title: body.fields.title,
        description: body.fields.description,
        file_size: body.fields.file_size,
        file_type: body.fields.file_type,
        preview_image_url: body.fields.preview_image_url || "",
        walrus_blob_id: body.fields.walrus_blob_id,
      },
    });

    return NextResponse.json({
      ok: true,
      ...indexed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to index listing",
      },
      { status: 500 },
    );
  }
}
