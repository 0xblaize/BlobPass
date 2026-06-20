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
      <main className="shell pb-24 pt-16">
        <section className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[7fr_5fr]">
          <div>
            <div className="section-num mb-3">03 — LEDGER</div>
            <h1 className="display text-[clamp(36px,5vw,64px)]">
              Your asset
              <br />
              <span style={{ color: "var(--signal-deep)" }}>library.</span>
            </h1>
            <p className="mono mt-8 max-w-[52ch] text-[14px] leading-[1.8] text-[var(--ink-60)]">
              Every pass your wallet holds, every listing it published. Verified
              against Sui object ownership, decoded from Walrus blob receipts —
              no servers, no second guesses.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="ascii-rule w-full" />
            <div className="section-num">PROTOCOL STACK</div>
            <StackPills />
          </div>
        </section>

        <LibraryGrid initialAssets={assets} initialStats={stats} />
      </main>
      <Footer />
    </>
  );
}
