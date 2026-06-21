"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LibraryCard } from "@/components/cards";
import type { LibraryAssetView, LibraryStats } from "@/lib/blobpass/types";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

type LibraryResponse = {
  ok: true;
  address: string;
  assets: LibraryAssetView[];
  stats: LibraryStats;
};

type TabKey = "All Assets" | "Purchased" | "My Listings";
type ViewMode = "table" | "grid";

export function LibraryGrid({
  initialAssets,
  initialStats,
}: {
  initialAssets: LibraryAssetView[];
  initialStats: LibraryStats;
}) {
  const account = useCurrentAccount();
  const [tab, setTab] = useState<TabKey>("All Assets");
  const [userView, setUserView] = useState<ViewMode | null>(null);
  const isDesktop = useIsDesktop();
  const view: ViewMode = userView ?? (isDesktop ? "table" : "grid");
  const setView = (next: ViewMode) => setUserView(next);

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
      return assets.filter((a) => a.status === "Owned");
    }
    if (tab === "My Listings") {
      return assets.filter((a) => a.status === "Your Listing");
    }
    return assets;
  }, [assets, tab]);

  return (
    <>
      {/* ───── Stats strip (mono k/v, no card chrome) ───── */}
      <section className="mt-16 grid grid-cols-1 gap-px border-y border-[var(--ink-16)] bg-[var(--ink-16)] md:grid-cols-3">
        <StatBlock
          num="01"
          label="OWNED ASSETS"
          value={stats.ownedAssets}
          note="Verified by access-pass ownership"
        />
        <StatBlock
          num="02"
          label="ACTIVE LISTINGS"
          value={stats.activeListings}
          note="Live access-pass listings"
        />
        <StatBlock
          num="03"
          label="TOTAL EARNINGS"
          value={stats.totalEarnings}
          note="Settled sales recorded in BlobPass"
        />
      </section>

      {/* ───── Controls bar ───── */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--ink-16)] pb-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="section-num">FILTER</div>
              <div className="mono mt-2 flex items-center gap-3 text-[12px] tracking-[0.16em]">
                {(["All Assets", "Purchased", "My Listings"] as const).map((item, i) => {
                  const active = tab === item;
                  return (
                    <div className="flex items-center gap-3" key={item}>
                      {i > 0 && <span className="text-[var(--ink-40)]">·</span>}
                      <button
                        className={
                          active
                            ? "text-[var(--ink)] underline decoration-[var(--signal)] decoration-2 underline-offset-[6px]"
                            : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                        }
                        onClick={() => setTab(item)}
                        type="button"
                      >
                        {item.toUpperCase()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="section-num">VIEW</div>
              <div className="mono mt-2 flex border border-[var(--ink-40)] text-[11px] tracking-[0.16em]">
                <button
                  className={`px-3 py-1.5 ${
                    view === "table"
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                  }`}
                  onClick={() => setView("table")}
                  type="button"
                >
                  TABLE
                </button>
                <button
                  className={`border-l border-[var(--ink-40)] px-3 py-1.5 ${
                    view === "grid"
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                  }`}
                  onClick={() => setView("grid")}
                  type="button"
                >
                  GRID
                </button>
              </div>
            </div>

            <div className="mono text-right text-[11px] tracking-[0.12em] text-[var(--ink-60)]">
              <div className="section-num">COUNT</div>
              <div className="mt-2 tabular-nums">
                {String(filteredAssets.length).padStart(3, "0")} / {String(assets.length).padStart(3, "0")}
              </div>
            </div>

            <button
              className="btn"
              disabled={syncing || !account?.address}
              onClick={() => void libraryQuery.refetch()}
              type="button"
            >
              {syncing ? "[ SYNCING... ]" : "[ SYNC WALLET ]"}
            </button>
          </div>
        </div>

        {!account?.address ? (
          <div className="mono mt-4 flex items-center gap-3 border border-[var(--ink-40)] px-4 py-3 text-[12px] tracking-[0.04em]">
            <span className="text-[var(--signal-deep)]">!</span>
            <span>Connect a Sui wallet to sync your BlobPass holdings and unlock secure downloads.</span>
          </div>
        ) : null}

        {/* ───── Empty states ───── */}
        {filteredAssets.length === 0 ? (
          assets.length > 0 ? (
            <EmptyBlock
              title="Nothing in this tab."
              body="The wallet is synced, but the current filter returned no rows."
              cta={
                <button
                  className="btn"
                  onClick={() => setTab("All Assets")}
                  type="button"
                >
                  [ SHOW ALL ]
                </button>
              }
            />
          ) : (
            <EmptyBlock
              title={
                account?.address
                  ? "Wallet has no unlocked files yet."
                  : "Connect a wallet to see your files."
              }
              body="BlobPass checks the Sui wallet against access-pass ownership before enabling downloads. Once an asset is bought or listed, it surfaces here automatically."
              cta={
                <div className="flex flex-wrap gap-3">
                  <Link className="button-primary" href="/marketplace">
                    [ EXPLORE MARKETPLACE ]
                  </Link>
                  <Link className="button-secondary" href="/upload">
                    [ UPLOAD FILE ]
                  </Link>
                </div>
              }
            />
          )
        ) : view === "table" ? (
          <LibraryTable assets={filteredAssets} />
        ) : (
          <div className="mt-10 grid gap-px bg-[var(--ink-16)] md:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <div className="bg-[var(--paper)]" key={asset.passId}>
                <LibraryCard asset={asset} />
              </div>
            ))}
            <Link
              className="surface surface-interactive grid min-h-[280px] place-items-center bg-[var(--paper)] p-8 text-center"
              href="/upload"
            >
              <div>
                <div className="section-num">+ NEW</div>
                <h3 className="display mt-3 text-[28px]">List a new asset.</h3>
                <p className="mono mt-3 max-w-[36ch] text-[12px] leading-6 text-[var(--ink-60)]">
                  Stream a blob to Walrus and mint its access pass on Sui.
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

/* ─────────────── Sub-components ─────────────── */

function StatBlock({
  num,
  label,
  value,
  note,
}: {
  num: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-3 bg-[var(--paper)] p-6">
      <div className="mono flex items-center justify-between text-[11px] tracking-[0.16em] text-[var(--ink-40)]">
        <span>{num}</span>
        <span>{label}</span>
      </div>
      <div className="display text-[44px] leading-none tabular-nums">{value}</div>
      <div className="ascii-rule" />
      <p className="mono text-[11px] leading-5 text-[var(--ink-60)]">{note}</p>
    </div>
  );
}

function StatusTag({ asset }: { asset: LibraryAssetView }) {
  const health = asset.storageHealth;
  const tone =
    health === "expired"
      ? "text-[#c0392b] border-[#c0392b]"
      : health === "expiring"
        ? "text-[#d4a853] border-[#d4a853]"
        : "text-[var(--signal-deep)] border-[var(--signal)]";

  const word =
    health === "expired"
      ? "EXPIRED"
      : health === "expiring"
        ? "EXPIRING"
        : "ACTIVE";

  return (
    <span className={`mono inline-flex border px-2 py-[2px] text-[10px] tracking-[0.16em] ${tone}`}>
      [ {word} ]
    </span>
  );
}

function shortHash(hash: string) {
  if (!hash) return "—";
  const stripped = hash.replace(/^0x/, "");
  return `${stripped.slice(0, 4)}…${stripped.slice(-4)}`;
}

function LibraryTable({ assets }: { assets: LibraryAssetView[] }) {
  return (
    <div className="mt-8 overflow-x-auto border border-[var(--ink-16)]">
      <table className="table-mono min-w-[860px]">
        <thead>
          <tr>
            <th>ASSET</th>
            <th>HASH</th>
            <th>CATEGORY</th>
            <th>STATUS</th>
            <th>STORAGE</th>
            <th className="text-right">PRICE</th>
            <th className="text-right">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.passId}>
              <td>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-[var(--ink)]">
                    {asset.title}
                  </span>
                  <span className="text-[11px] tracking-[0.04em] text-[var(--ink-40)]">
                    {asset.status === "Your Listing" ? "@you · listing" : "@you · owned"}
                  </span>
                </div>
              </td>
              <td className="text-[12px] tabular-nums text-[var(--ink-60)]">
                {shortHash(asset.fileHash)}
              </td>
              <td className="text-[11px] tracking-[0.12em] text-[var(--ink-60)]">
                {asset.category.toUpperCase()}
              </td>
              <td>
                <StatusTag asset={asset} />
              </td>
              <td className="text-[11px] tracking-[0.04em] text-[var(--ink-60)]">
                {asset.storageRenewalLabel}
              </td>
              <td className="text-right text-[13px] font-medium tabular-nums">
                {asset.price}
                <span className="ml-1 text-[10px] text-[var(--ink-40)]">SUI</span>
              </td>
              <td className="text-right">
                <Link
                  className="mono border-b border-[var(--ink)] pb-[1px] text-[11px] tracking-[0.16em] hover:text-[var(--signal-deep)]"
                  href={asset.downloadUrl ?? `/marketplace#listing-${asset.listingId}`}
                >
                  {asset.action.toUpperCase()}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyBlock({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="mt-10 border border-dashed border-[var(--ink-40)] p-12 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="section-num">EMPTY STATE</div>
        <h3 className="display mt-3 text-[clamp(24px,3vw,32px)]">{title}</h3>
        <p className="mono mx-auto mt-4 max-w-[52ch] text-[12px] leading-7 text-[var(--ink-60)]">
          {body}
        </p>
        <div className="mt-8 flex justify-center">{cta}</div>
      </div>
    </div>
  );
}
