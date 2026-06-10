import { NextRequest, NextResponse } from "next/server";
import { syncDelistedAccessPass } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DelistBody = {
  listingId?: string;
  passId?: string;
  sellerAddress?: string;
  transactionDigest?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DelistBody;

    if (!body.listingId || !body.sellerAddress) {
      return NextResponse.json(
        { error: "listingId and sellerAddress are required" },
        { status: 400 },
      );
    }

    const delisted = await syncDelistedAccessPass({
      listingId: body.listingId,
      sellerAddress: body.sellerAddress,
      passId: body.passId,
      transactionDigest: body.transactionDigest,
    });

    if (!delisted) {
      return NextResponse.json({ error: "Listing not found for this seller" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      ...delisted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delist failed" },
      { status: 500 },
    );
  }
}
