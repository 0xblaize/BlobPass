import { NextRequest, NextResponse } from "next/server";
import { getDataAccessPassByFileHash } from "@/lib/blobpass/ledger";
import { mistToSui, shortAddress, shortBlob, suiToMist } from "@/lib/blobpass/format";

export const dynamic = "force-dynamic";

function getRoyaltyMist(priceMist: string, royaltyBps: number) {
  const price = BigInt(priceMist || "0");
  const bps = BigInt(Number.isFinite(royaltyBps) ? royaltyBps : 500);
  const royalty = (price * bps) / BigInt(10_000);

  return royalty > BigInt(0) ? royalty.toString() : suiToMist("0.01");
}

export async function GET(request: NextRequest) {
  const fileHash = request.nextUrl.searchParams.get("fileHash") || "";

  if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
    return NextResponse.json({ error: "fileHash must be a SHA-256 hex digest" }, { status: 400 });
  }

  const pass = await getDataAccessPassByFileHash(fileHash);

  if (!pass) {
    return NextResponse.json({
      ok: true,
      exists: false,
    });
  }

  const royaltyMist = getRoyaltyMist(pass.priceMist, pass.royaltyBps);

  return NextResponse.json({
    ok: true,
    exists: true,
    match: {
      passId: pass.id,
      listingId: pass.listingId,
      title: pass.content.fields.title,
      blobId: pass.content.fields.walrus_blob_id,
      blobLabel: shortBlob(pass.content.fields.walrus_blob_id),
      originalUploader: pass.originalUploader,
      originalUploaderLabel: shortAddress(pass.originalUploader),
      royaltyBps: pass.royaltyBps,
      royaltyMist,
      royaltySui: mistToSui(royaltyMist),
      storageEndEpoch: pass.storageEndEpoch,
      storageEpochDurationDays: pass.storageEpochDurationDays,
    },
  });
}
