import { NextRequest, NextResponse } from "next/server";
import { sanitizeFilename } from "@/lib/blobpass/format";
import {
  getDataAccessPass,
  getDataAccessPassByBlobId,
  verifyAccessPassOwnership,
} from "@/lib/blobpass/ledger";
import { readProtectedWalrusBlob } from "@/lib/blobpass/walrus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DownloadRequest = {
  passId?: string;
  blobId?: string;
  walletAddress?: string;
  address?: string;
};

async function streamDownload({
  passId,
  blobId,
  walletAddress,
  address,
}: DownloadRequest) {
  const wallet = walletAddress || address;

  if (!wallet) {
    return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
  }

  const pass = passId
    ? await getDataAccessPass(passId)
    : blobId
      ? await getDataAccessPassByBlobId(blobId)
      : null;

  if (!pass) {
    return NextResponse.json({ error: "Access pass not found" }, { status: 404 });
  }

  const hiddenBlobId = pass.content.fields.walrus_blob_id;

  if (blobId && blobId !== hiddenBlobId) {
    return NextResponse.json(
      { error: "Blob id does not match access pass" },
      { status: 403 },
    );
  }

  const ownsPass = await verifyAccessPassOwnership(wallet, pass.id);

  if (!ownsPass) {
    return NextResponse.json({ error: "Access pass ownership not found" }, { status: 403 });
  }

  const upstream = await readProtectedWalrusBlob(hiddenBlobId);
  const filename = pass.assetFilename
    ? pass.assetFilename.replace(/[\r\n"]/g, "").trim()
    : `${sanitizeFilename(pass.content.fields.title)}.bin`;
  const headers = new Headers(upstream.headers);

  headers.set("Content-Type", pass.content.fields.file_type || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  return new Response(upstream.body ?? (await upstream.arrayBuffer()), {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await streamDownload({
      passId: request.nextUrl.searchParams.get("passId") || undefined,
      blobId: request.nextUrl.searchParams.get("blobId") || undefined,
      address: request.nextUrl.searchParams.get("address") || undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Download failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DownloadRequest;

    return await streamDownload(body);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Download failed",
      },
      { status: 500 },
    );
  }
}
