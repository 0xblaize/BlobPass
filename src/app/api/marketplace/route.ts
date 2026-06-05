import { NextResponse } from "next/server";
import { getMarketplaceListings } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await getMarketplaceListings();

  return NextResponse.json({
    ok: true,
    source: listings[0]?.source ?? "demo",
    listings,
  });
}
