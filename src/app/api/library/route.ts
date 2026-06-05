import { NextRequest, NextResponse } from "next/server";
import { DEMO_BUYER_ADDRESS } from "@/lib/blobpass/format";
import { getLibraryAssets, getLibraryStats } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address") || DEMO_BUYER_ADDRESS;
  const assets = await getLibraryAssets(address);

  return NextResponse.json({
    ok: true,
    address,
    assets,
    stats: getLibraryStats(assets),
  });
}
