"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FeatureListing, ListingCard } from "@/components/cards";
import type { MarketplaceListing } from "@/lib/blobpass/types";

const categories = ["All Files", "Datasets", "Video", "Source Code", "Documents", "AI Models"];

function purchaseCount(value: string) {
  return Number.parseInt(value.replace(/\D/g, ""), 10) || 0;
}

function normalizeCategory(category: string) {
  return categories.includes(category) ? category : "All Files";
}

export function MarketplaceCatalog({
  initialListings,
  initialQuery,
  initialCategory,
}: {
  initialListings: MarketplaceListing[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery || "");
  const [category, setCategory] = useState(normalizeCategory(initialCategory || "All Files"));

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialListings.filter((item) => {
      const categoryMatch = category === "All Files" || item.category === category;
      const searchMatch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [category, initialListings, search]);

  const trendingListings = useMemo(
    () =>
      [...filteredListings]
        .sort((left, right) => purchaseCount(right.purchases) - purchaseCount(left.purchases))
        .slice(0, 2),
    [filteredListings],
  );

  function syncUrl(nextSearch: string, nextCategory: string) {
    const params = new URLSearchParams();
    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch) params.set("q", trimmedSearch);
    if (nextCategory !== "All Files") params.set("category", nextCategory);
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function updateSearch(value: string) {
    setSearch(value);
  }

  function commitSearch() {
    syncUrl(search, category);
  }

  function updateCategory(value: string) {
    const nextCategory = normalizeCategory(value);
    setCategory(nextCategory);
    syncUrl(search, nextCategory);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All Files");
    router.replace(pathname, { scroll: false });
  }

  return (
    <>
      {/* ─────── HEADER: asymmetric 7/5 ─────── */}
      <section className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div>
          <div className="section-num mb-3">01 — CATALOG</div>
          <h1 className="display text-[clamp(36px,5vw,64px)]">
            Browse the
            <br />
            <span style={{ color: "var(--signal-deep)" }}>access ledger.</span>
          </h1>
          <p className="mono mt-8 max-w-[52ch] text-[14px] leading-[1.8] text-[var(--ink-60)]">
            Every listing here is a live Sui pass, backed by a Walrus blob.
            Buy once — the pass moves to your wallet and the file follows.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="ascii-rule" />
          <label
            className="mono flex items-baseline gap-3 border-b border-[var(--ink-40)] pb-2 focus-within:border-b-[var(--signal)] focus-within:[border-bottom-width:2px] focus-within:[padding-bottom:calc(0.5rem-1px)]"
            htmlFor="marketplace-search"
          >
            <span className="text-[var(--signal-deep)] text-[14px]">&gt;</span>
            <input
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--ink-40)]"
              id="marketplace-search"
              onBlur={commitSearch}
              onChange={(event) => updateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitSearch();
              }}
              placeholder="search title, file, dataset…"
              value={search}
            />
            <span className="text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
              [ ⏎ ]
            </span>
          </label>
          <div className="mono flex justify-between text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
            <span>{filteredListings.length} OF {initialListings.length} LISTINGS</span>
            <button
              className="hover:text-[var(--signal-deep)]"
              onClick={clearFilters}
              type="button"
            >
              [ CLEAR ]
            </button>
          </div>
        </div>
      </section>

      {/* ─────── CATEGORY TABS ─────── */}
      <div
        className="mono mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--ink-16)] py-4 text-[12px] tracking-[0.18em]"
        id="catalog"
      >
        <span className="text-[var(--signal-deep)]">&gt;</span>
        {categories.map((item, i) => {
          const active = category === item;
          return (
            <div className="flex items-center gap-6" key={item}>
              {i > 0 && <span className="text-[var(--ink-40)]">·</span>}
              <button
                className={
                  active
                    ? "text-[var(--ink)] underline decoration-[var(--signal)] decoration-2 underline-offset-[6px]"
                    : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                }
                onClick={() => updateCategory(item)}
                type="button"
              >
                {item.toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─────── TRENDING ─────── */}
      <section className="mt-20 space-y-8" id="trending-highlights">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[8fr_4fr]">
          <div>
            <div className="section-num mb-2">02 — TRENDING</div>
            <h2 className="display text-[clamp(32px,4vw,56px)]">
              Most-passed this week.
            </h2>
          </div>
          <a
            className="mono text-[12px] tracking-[0.18em] text-[var(--signal-deep)] hover:underline md:text-right"
            href="#latest-discoveries"
          >
            ↓ JUMP TO LATEST
          </a>
        </div>
        {trendingListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] xl:grid-cols-2">
            {trendingListings.map((item) => (
              <div className="bg-[var(--paper)]" key={item.passId}>
                <FeatureListing item={item} />
              </div>
            ))}
          </div>
        ) : initialListings.length > 0 ? (
          <EmptyState
            title="No matches for current filters."
            body="Try another category or clear your search."
            cta={
              <button className="button-primary" onClick={clearFilters} type="button">
                [ RESET FILTERS ]
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No listings yet."
            body="This page reflects live BlobPass state. As soon as a creator uploads a file and lists its access pass, it surfaces here."
            cta={
              <div className="flex flex-wrap gap-3">
                <Link className="button-primary" href="/upload">
                  [ UPLOAD FIRST ASSET ]
                </Link>
                <Link className="button-secondary" href="/">
                  [ HOME ]
                </Link>
              </div>
            }
          />
        )}
      </section>

      {/* ─────── LATEST ─────── */}
      <section className="mt-24 space-y-8" id="latest-discoveries">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[8fr_4fr]">
          <div>
            <div className="section-num mb-2">03 — LATEST</div>
            <h2 className="display text-[clamp(32px,4vw,56px)]">
              Newly registered.
            </h2>
          </div>
          <span className="mono text-[12px] tracking-[0.18em] text-[var(--ink-40)] md:text-right">
            SHOWING {filteredListings.length} LIVE LISTINGS
          </span>
        </div>
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredListings.map((item, index) => (
              <div className="bg-[var(--paper)]" key={item.passId}>
                <ListingCard item={item} priority={index < 3} />
              </div>
            ))}
          </div>
        ) : initialListings.length > 0 ? (
          <EmptyState
            title="Nothing matches that search."
            body="The catalog is live, but your current filters came back empty."
            cta={
              <button className="button-primary" onClick={clearFilters} type="button">
                [ CLEAR SEARCH ]
              </button>
            }
          />
        ) : null}
      </section>
    </>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[var(--ink-40)] p-12 text-center">
      <div className="section-num">EMPTY</div>
      <h3 className="display mt-3 text-[clamp(24px,3vw,36px)]">{title}</h3>
      <p className="mono mx-auto mt-4 max-w-[56ch] text-[13px] leading-7 text-[var(--ink-60)]">
        {body}
      </p>
      <div className="mt-8 flex justify-center">{cta}</div>
    </div>
  );
}
