import { Blocks, Filter, Search, TrendingUp } from "lucide-react";
import { FeatureListing, ListingCard } from "@/components/cards";
import { Footer, Header } from "@/components/chrome";
import { listings } from "@/lib/data";

const categories = ["All Files", "Datasets", "Video", "Source Code", "Documents", "AI Models"];

export default function MarketplacePage() {
  return (
    <>
      <Header active="marketplace" />
      <main className="shell py-16">
        <section className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <h1 className="title text-5xl leading-tight md:text-6xl">
              Discover High-Value <span className="block text-cyan-300">Digital Assets</span>
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-zinc-400">
              Browse verified files stored on Walrus and secured by the Sui
              ecosystem. Own your data access passes as onchain assets.
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex h-16 w-full items-center gap-4 rounded-xl border border-white/10 bg-zinc-950 px-6 text-zinc-400">
              <Search size={22} />
              <span>Search files, code, datasets...</span>
            </div>
          </div>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-cyan-300/12 text-cyan-300">
            <Filter size={20} />
          </button>
          {categories.map((category, index) => (
            <button
              className={
                index === 0
                  ? "button-primary min-h-11 px-7"
                  : "button-secondary min-h-11 rounded-full px-7 text-zinc-300"
              }
              key={category}
            >
              {category}
            </button>
          ))}
        </div>

        <section className="mt-20 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="title flex items-center gap-3 text-2xl">
              <TrendingUp className="text-cyan-300" /> Trending Highlights
            </h2>
            <a className="font-bold text-cyan-300" href="#">
              View Leaderboard
            </a>
          </div>
          <div className="grid gap-7 xl:grid-cols-2">
            {listings.slice(0, 2).map((item) => (
              <FeatureListing item={item} key={item.id} />
            ))}
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="title flex items-center gap-3 text-2xl">
              <Blocks className="text-cyan-300" /> Latest Discoveries
            </h2>
            <span className="text-zinc-400">Sorted by: Recent</span>
          </div>
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {listings.map((item) => (
              <ListingCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
