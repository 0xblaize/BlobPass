import { NextRequest, NextResponse } from "next/server";
import { purchaseAccessPass } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid purchase request" }, { status: 400 });
    }

    const { passId, buyerAddress } = body as {
      passId?: string;
      buyerAddress?: string;
    };

    if (!passId || !buyerAddress) {
      return NextResponse.json(
        { error: "passId and buyerAddress are required" },
        { status: 400 },
      );
    }

    const purchase = await purchaseAccessPass(passId, buyerAddress);

    if (!purchase) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      ...purchase,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Purchase failed",
      },
      { status: 500 },
    );
  }
}
