import { Plus, ShieldCheck, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { LibraryCard, StatCard } from "@/components/cards";
import { Footer, Header, StackPills } from "@/components/chrome";
import { libraryAssets } from "@/lib/data";

export default function LibraryPage() {
  return (
    <>
      <Header active="library" />
      <main className="shell py-16">
        <section className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <h1 className="title text-5xl">Your Asset Library</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              Manage your decentralized digital inventory. All assets are
              verified on the Sui Network and securely stored on Walrus.
            </p>
          </div>
          <StackPills />
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <StatCard icon={<ShieldCheck size={22} />} label="Owned Assets" value="42" note="+3 purchased this month" />
          <StatCard icon={<Plus size={22} />} label="Your Listings" value="18" note="5 assets currently for sale" />
          <StatCard icon={<Wallet size={22} />} label="Total Earnings" value="1,284.50 SUI" note="Available to withdraw" />
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
              <span>Showing 6 results</span>
              <button className="button-secondary min-h-10 px-4">
                <Zap size={17} /> Sync Wallet
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {libraryAssets.map((asset) => (
              <LibraryCard asset={asset} key={asset.title} />
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
                <p className="mt-4 text-zinc-400">
                  Upload your files to Walrus and start earning SUI today.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
