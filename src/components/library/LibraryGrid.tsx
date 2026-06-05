"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShieldCheck, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { LibraryCard, StatCard } from "@/components/cards";
import type { LibraryAssetView, LibraryStats } from "@/lib/blobpass/types";

type LibraryResponse = {
  ok: true;
  address: string;
  assets: LibraryAssetView[];
  stats: LibraryStats;
};

export function LibraryGrid({
  initialAssets,
  initialStats,
}: {
  initialAssets: LibraryAssetView[];
  initialStats: LibraryStats;
}) {
  const account = useCurrentAccount();
  const libraryQuery = useQuery<LibraryResponse>({
    queryKey: ["library", account?.address ?? "disconnected"],
    queryFn: async () => {
      const response = await fetch(
        `/api/library?address=${encodeURIComponent(account?.address ?? "")}`,
      );

      if (!response.ok) {
        throw new Error("Library sync failed");
      }

      return (await response.json()) as LibraryResponse;
    },
    enabled: Boolean(account?.address),
    initialData: {
      ok: true,
      address: account?.address ?? "",
      assets: initialAssets,
      stats: initialStats,
    },
  });

  const assets = libraryQuery.data?.assets ?? initialAssets;
  const stats = libraryQuery.data?.stats ?? initialStats;
  const syncing = libraryQuery.isFetching;

  return (
    <>
      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <StatCard
          icon={<ShieldCheck size={22} />}
          label="Owned Assets"
          note="Verified by access pass ownership"
          value={stats.ownedAssets}
        />
        <StatCard
          icon={<Plus size={22} />}
          label="Your Listings"
          note="Active kiosk listings"
          value={stats.activeListings}
        />
        <StatCard
          icon={<Wallet size={22} />}
          label="Total Earnings"
          note="Demo estimate from active listings"
          value={stats.totalEarnings}
        />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div className="panel inline-flex rounded-lg p-1">
            {["All Assets", "Purchased", "My Listings"].map((tab, index) => (
              <button
                className={`h-11 rounded-md px-7 font-bold ${
                  index === 0 ? "bg-cyan-300 text-black" : "text-zinc-300"
                }`}
                key={tab}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            <span>Showing {assets.length} results</span>
            <button
              className="button-secondary min-h-10 px-4"
              disabled={syncing || !account?.address}
              onClick={() => void libraryQuery.refetch()}
            >
              <Zap size={17} /> {syncing ? "Syncing..." : "Sync Wallet"}
            </button>
          </div>
        </div>

        {!account?.address ? (
          <p className="mt-6 text-sm font-bold text-amber-300">
            Connect a Sui wallet to run ownership verification against the Tatum RPC node.
          </p>
        ) : null}

        <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <LibraryCard asset={asset} key={asset.passId} />
          ))}
          <Link
            className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-white/16 p-8 text-center hover:border-cyan-300/60"
            href="/upload"
          >
            <div>
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-zinc-900">
                <Plus size={30} />
              </div>
              <h3 className="title text-2xl">List New Asset</h3>
              <p className="mt-4 text-zinc-400">Upload your files to Walrus and start earning SUI today.</p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
