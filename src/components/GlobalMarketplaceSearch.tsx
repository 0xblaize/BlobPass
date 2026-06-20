"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

export function GlobalMarketplaceSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const inputKey = `${pathname}:${query}:${searchParams.get("category") || ""}`;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("q") || "").trim();

    const params = new URLSearchParams();
    const activeCategory = pathname === "/marketplace" ? searchParams.get("category") : null;

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (activeCategory) {
      params.set("category", activeCategory);
    }

    const href = params.toString() ? `/marketplace?${params.toString()}#catalog` : "/marketplace#catalog";
    router.push(href);
  }

  return (
    <form
      className="mono ml-auto hidden h-9 min-w-[260px] items-center gap-2 border border-[var(--ink-40)] px-3 text-[12px] transition focus-within:border-[var(--signal)] md:flex"
      onSubmit={submitSearch}
    >
      <span className="text-[var(--signal-deep)]">&gt;</span>
      <input
        className="w-full bg-transparent text-[13px] tracking-[0.02em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-40)]"
        defaultValue={query}
        key={inputKey}
        name="q"
        placeholder="search marketplace_"
      />
      <button
        className="border-l border-[var(--ink-16)] pl-2 text-[11px] tracking-[0.16em] text-[var(--ink-40)] hover:text-[var(--signal-deep)]"
        type="submit"
      >
        ENTER
      </button>
    </form>
  );
}
