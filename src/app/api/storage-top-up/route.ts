import { NextRequest, NextResponse } from "next/server";
import { topUpStorage } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StorageTopUpBody = {
  fileHash?: string;
  additionalEpochs?: number;
  walletAddress?: string;
  transactionDigest?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StorageTopUpBody;
    const additionalEpochs = Number(body.additionalEpochs);

    if (!body.fileHash || !body.walletAddress || !Number.isFinite(additionalEpochs) || additionalEpochs < 1) {
      return NextResponse.json(
        { error: "fileHash, walletAddress, and additionalEpochs are required" },
        { status: 400 },
      );
    }

    const topUp = await topUpStorage({
      fileHash: body.fileHash,
      additionalEpochs,
      walletAddress: body.walletAddress,
      transactionDigest: body.transactionDigest,
    });

    return NextResponse.json({
      ok: true,
      ...topUp,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Storage top-up failed" },
      { status: 500 },
    );
  }
}
