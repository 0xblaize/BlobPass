"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShieldCheck, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  const [tab, setTab] = useState<"All Assets" | "Purchased" | "My Listings">("All Assets");
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
  const filteredAssets = useMemo(() => {
    if (tab === "Purchased") {
      return assets.filter((asset) => asset.status === "Owned");
    }

    if (tab === "My Listings") {
      return assets.filter((asset) => asset.status === "Your Listing");
    }

    return assets;
  }, [assets, tab]);

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
          note="Settled sales recorded in BlobPass"
          value={stats.totalEarnings}
        />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div className="panel inline-flex rounded-lg p-1">
            {(["All Assets", "Purchased", "My Listings"] as const).map((item) => (
              <button
                className={`h-11 rounded-md px-7 font-bold ${
                  tab === item ? "bg-cyan-300 text-black" : "text-zinc-300"
                }`}
                key={item}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 text-sm text-zinc-400">
            <span>Showing {filteredAssets.length} results</span>
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
            Connect a Sui wallet to sync your BlobPass holdings and unlock secure downloads.
          </p>
        ) : null}

        {filteredAssets.length > 0 ? (
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
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
        ) : assets.length > 0 ? (
          <div className="panel mt-10 rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
            <div className="mx-auto max-w-2xl">
              <h3 className="title text-2xl text-white">Nothing in this tab yet.</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Your wallet is connected and synced, but the current library filter came back empty.
              </p>
              <div className="mt-8 flex justify-center">
                <button
                  className="button-primary min-h-12 min-w-[190px] rounded-full"
                  onClick={() => setTab("All Assets")}
                  type="button"
                >
                  Show All Assets
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel mt-10 rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
            <div className="mx-auto max-w-2xl">
              <h3 className="title text-2xl text-white">
                {account?.address ? "Your wallet has no unlocked files yet." : "Connect a wallet to see your files."}
              </h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Blob Pass checks your Sui wallet against access-pass ownership before enabling downloads.
                Once you buy or list an asset, it will show up here automatically.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link className="button-primary min-h-12 min-w-[190px] rounded-full" href="/marketplace">
                  Explore Marketplace
                </Link>
                <Link className="button-secondary min-h-12 min-w-[190px] rounded-full" href="/upload">
                  Upload File
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
