"use client";

import { Blocks, Filter, Search, TrendingUp } from "lucide-react";
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

    if (trimmedSearch) {
      params.set("q", trimmedSearch);
    }

    if (nextCategory !== "All Files") {
      params.set("category", nextCategory);
    }

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
      <section className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <h1 className="title text-5xl leading-tight md:text-6xl">
            Discover High-Value <span className="block text-cyan-300">Digital Assets</span>
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-400">
            Browse verified files stored on Walrus and secured by the Sui ecosystem. Own your
            data access passes as portable marketplace assets.
          </p>
        </div>
        <div className="flex items-center">
          <label
            className="flex h-16 w-full items-center gap-4 rounded-xl border border-white/10 bg-zinc-950 px-6 text-zinc-400"
            htmlFor="marketplace-search"
          >
            <Search size={22} />
            <input
              className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
              id="marketplace-search"
              onBlur={commitSearch}
              onChange={(event) => updateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitSearch();
                }
              }}
              placeholder="Search files, code, datasets..."
              value={search}
            />
          </label>
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-4" id="catalog">
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-cyan-300/12 text-cyan-300 transition hover:bg-cyan-300/18"
          onClick={clearFilters}
          type="button"
        >
          <Filter size={20} />
        </button>
        {categories.map((item) => {
          const active = category === item;

          return (
            <button
              className={
                active
                  ? "button-primary min-h-11 px-7"
                  : "button-secondary min-h-11 rounded-full px-7 text-zinc-300"
              }
              key={item}
              onClick={() => updateCategory(item)}
              type="button"
            >
              {item}
            </button>
          );
        })}
      </div>

      <section className="mt-20 space-y-8" id="trending-highlights">
        <div className="flex items-center justify-between">
          <h2 className="title flex items-center gap-3 text-2xl">
            <TrendingUp className="text-cyan-300" /> Trending Highlights
          </h2>
          <a className="font-bold text-cyan-300" href="#latest-discoveries">
            Jump to Latest
          </a>
        </div>
        {trendingListings.length > 0 ? (
          <div className="grid gap-7 xl:grid-cols-2">
            {trendingListings.map((item) => (
              <FeatureListing item={item} key={item.passId} />
            ))}
          </div>
        ) : initialListings.length > 0 ? (
          <div className="panel rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
            <h3 className="title text-2xl text-white">No listings match your current filters.</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Try another category or clear your search to inspect the live catalog.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                className="button-primary min-h-12 min-w-[190px] rounded-full"
                onClick={clearFilters}
                type="button"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="panel rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
            <h3 className="title text-2xl text-white">No listings yet.</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              This marketplace reflects live BlobPass state only. As soon as a creator uploads a
              file and lists its access pass, it will appear here.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="button-primary min-h-12 min-w-[190px] rounded-full" href="/upload">
                Upload First Asset
              </Link>
              <Link className="button-secondary min-h-12 min-w-[190px] rounded-full" href="/">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="mt-20 space-y-8" id="latest-discoveries">
        <div className="flex items-center justify-between">
          <h2 className="title flex items-center gap-3 text-2xl">
            <Blocks className="text-cyan-300" /> Latest Discoveries
          </h2>
          <span className="text-zinc-400">Showing {filteredListings.length} live listings</span>
        </div>
        {filteredListings.length > 0 ? (
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredListings.map((item) => (
              <ListingCard item={item} key={item.passId} />
            ))}
          </div>
        ) : initialListings.length > 0 ? (
          <div className="panel rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
            <h3 className="title text-2xl text-white">Nothing matches that search yet.</h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              The catalog is live, but your current filters came back empty.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                className="button-primary min-h-12 min-w-[190px] rounded-full"
                onClick={clearFilters}
                type="button"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
