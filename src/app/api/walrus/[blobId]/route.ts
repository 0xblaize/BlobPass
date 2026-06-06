import { NextResponse } from "next/server";
import { getPublicLocalWalrusBlob } from "@/lib/blobpass/walrus";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ blobId: string }> },
) {
  const { blobId } = await params;
  const response = await getPublicLocalWalrusBlob(blobId);

  if (!response) {
    return NextResponse.json({ error: "Public blob not found" }, { status: 404 });
  }

  return response;
}
