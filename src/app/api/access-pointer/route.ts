import { NextRequest, NextResponse } from "next/server";
import { mintAccessPointer } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccessPointerBody = {
  fileHash?: string;
  buyerAddress?: string;
  royaltyMist?: string;
  transactionDigest?: string;
  passId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AccessPointerBody;

    if (!body.fileHash || !body.buyerAddress || !body.royaltyMist) {
      return NextResponse.json(
        { error: "fileHash, buyerAddress, and royaltyMist are required" },
        { status: 400 },
      );
    }

    const pointer = await mintAccessPointer({
      fileHash: body.fileHash,
      buyerAddress: body.buyerAddress,
      royaltyMist: body.royaltyMist,
      transactionDigest: body.transactionDigest,
      passId: body.passId,
    });

    if (!pointer) {
      return NextResponse.json({ error: "Registered blob hash not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      ...pointer,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access pointer mint failed" },
      { status: 500 },
    );
  }
}
