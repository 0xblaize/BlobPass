import { Footer, Header, StackPills } from "@/components/chrome";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { getLibraryStats } from "@/lib/blobpass/ledger";
import type { LibraryAssetView } from "@/lib/blobpass/types";

export default async function LibraryPage() {
  const assets: LibraryAssetView[] = [];
  const stats = getLibraryStats(assets);

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

        <LibraryGrid initialAssets={assets} initialStats={stats} />
      </main>
      <Footer />
    </>
  );
}
