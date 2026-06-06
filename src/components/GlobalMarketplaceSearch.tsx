"use client";

import { Search } from "lucide-react";
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
      className="ml-auto hidden h-11 min-w-[280px] items-center gap-3 rounded-lg border border-white/15 bg-zinc-950 px-4 text-zinc-400 transition hover:border-cyan-300/40 focus-within:border-cyan-300/60 focus-within:text-white md:flex"
      onSubmit={submitSearch}
    >
      <Search size={18} />
      <input
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        defaultValue={query}
        key={inputKey}
        name="q"
        placeholder="Search marketplace..."
      />
      <button className="text-cyan-300 transition hover:text-cyan-200" type="submit">
        <Search size={16} />
      </button>
    </form>
  );
}
