import { NextRequest, NextResponse } from "next/server";
import { getLibraryAssets, getLibraryStatsForAddress } from "@/lib/blobpass/ledger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address") || "";
  const assets = await getLibraryAssets(address);
  const stats = await getLibraryStatsForAddress(address);

  return NextResponse.json({
    ok: true,
    address,
    assets,
    stats,
  });
}
