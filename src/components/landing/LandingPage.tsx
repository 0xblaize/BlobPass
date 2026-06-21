import Link from "next/link";
import { Suspense } from "react";
import { ListingCard } from "@/components/cards";
import { Footer, Header, StackPills } from "@/components/chrome";
import { getMarketplaceListings } from "@/lib/blobpass/ledger";
import { AccessControlSection } from "./AccessControlSection";
import { RabbitScene } from "./RabbitScene";
import { TerminalSection } from "./TerminalSection";

export function LandingPage() {
  const buildTs = new Date().toISOString().replace("T", " · ").slice(0, 19);

  return (
    <div>
      {/* ──────────────── HERO (ink zone) ──────────────── */}
      <div className="zone-ink relative overflow-hidden">
        <Header landing />
        <main className="shell relative">
          <section className="flex flex-col items-stretch gap-8 pb-16 pt-6 md:flex-row md:items-center md:gap-12 md:pb-32 md:pt-12">
            {/* LEFT: typographic mass (≈ 7/12) */}
            <div className="min-w-0 md:basis-[58%]">
              <div className="mb-8 flex items-center gap-3">
                <span className="tag tag-signal">[ MAINNET-READY ]</span>
                <span className="ascii-rule hidden flex-1 md:block" />
              </div>

              <h1
                className="display text-[clamp(32px,9vw,80px)]"
                style={{ color: "var(--paper)" }}
              >
                Files,
                <br />
                <span style={{ color: "var(--signal)" }}>certified.</span>
                <br />
                Access,
                <br />
                <span className="italic" style={{ fontWeight: 400 }}>
                  permanent.
                </span>
              </h1>

              <p className="mono mt-10 max-w-[44ch] text-[14px] leading-[1.75] text-[var(--paper-60)]">
                BlobPass is the access ledger for files stored on Walrus. Mint a
                Sui pass, list it, and the buyer carries proof of ownership in
                their wallet — forever.
              </p>

              <div className="mt-12 flex flex-wrap gap-3">
                <Link className="button-primary" href="/marketplace">
                  [ MARKETPLACE ]
                </Link>
                <Link className="button-secondary" href="/upload">
                  [ UPLOAD A FILE ]
                </Link>
              </div>

              {/* Meta strip */}
              <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-[var(--paper-16)] pt-6 md:grid-cols-4">
                <Meta k="CHAIN" v="SUI · TESTNET" />
                <Meta k="STORAGE" v="WALRUS" />
                <Meta k="VERIFY" v="TATUM RPC" />
                <Meta k="BUILD" v={buildTs.slice(0, 10)} />
              </div>
            </div>

            {/* RIGHT: rabbit crate (≈ 5/12) */}
            <div className="flex w-full min-w-0 justify-center md:basis-[42%] md:justify-end">
              <div className="relative w-full" style={{ maxWidth: 560, minWidth: 0 }}>
                {/* top legend */}
                <div
                  className="mono mb-3 flex items-center justify-between"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "rgba(250,247,240,0.5)",
                  }}
                >
                  <span style={{ color: "var(--signal)" }}>● LIVE</span>
                  <span>SUBJECT · RABBIT.GLB</span>
                  <span>CAM-01</span>
                </div>

                {/* the crate */}
                <div
                  className="relative w-full md:!min-h-[380px]"
                  style={{
                    aspectRatio: "1 / 1",
                    backgroundColor: "#06080a",
                    border: "1px solid rgba(250,247,240,0.55)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(0,200,83,0.06), inset 0 0 80px rgba(0,200,83,0.10)",
                  }}
                >
                  {/* placeholder — visible until GLB loads */}
                  <div
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                    style={{ zIndex: 0 }}
                  >
                    <div className="text-center">
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.22em",
                          color: "rgba(250,247,240,0.55)",
                        }}
                      >
                        LOADING · RABBIT.GLB
                      </div>
                      <div
                        className="mono mt-2"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          color: "var(--signal)",
                        }}
                      >
                        4.0 MB · GLTF 2.0
                      </div>
                    </div>
                  </div>

                  {/* Three.js canvas */}
                  <RabbitScene
                    className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
                  />

                  <CornerMark className="left-2 top-2" />
                  <CornerMark className="right-2 top-2 rotate-90" />
                  <CornerMark className="bottom-2 right-2 rotate-180" />
                  <CornerMark className="bottom-2 left-2 -rotate-90" />
                </div>

                {/* bottom legend */}
                <div
                  className="mono mt-3 flex justify-between"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "rgba(250,247,240,0.5)",
                  }}
                >
                  <span>HOVER · ROTATE</span>
                  <span>DRAG · ORBIT</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ──────────────── HOW IT WORKS / ACCESS CONTROL ──────────────── */}
      <main className="zone-paper">
        <div className="border-b border-[var(--ink-16)]">
          <AccessControlSection />
        </div>

        {/* Terminal section keeps its dark visual identity (it's a terminal) */}
        <div className="zone-ink relative border-y border-[var(--paper-16)]" id="how">
          <TerminalSection />
        </div>

        {/* ──────────────── MARKETPLACE PREVIEW ──────────────── */}
        <section
          className="shell py-32"
          id="marketplace-preview"
        >
          <div className="mb-16 grid grid-cols-1 items-end gap-8 md:grid-cols-[8fr_4fr]">
            <div>
              <div className="section-num mb-2">02 — TRADE</div>
              <h2 className="display text-[clamp(28px,8vw,80px)]">
                What&apos;s live
                <br />
                right now.
              </h2>
            </div>
            <div className="flex md:justify-end">
              <Link
                className="mono inline-flex items-center gap-2 border-b border-[var(--ink)] pb-1 text-[12px] tracking-[0.18em] hover:text-[var(--signal-deep)]"
                href="/marketplace"
              >
                BROWSE ALL LISTINGS
              </Link>
            </div>
          </div>

          <Suspense fallback={<MarketplacePreviewSkeleton />}>
            <MarketplacePreview />
          </Suspense>
        </section>

        {/* ──────────────── DUAL VALUE PROPS (asymmetric 8/4) ──────────────── */}
        <section className="shell pb-32" id="stack">
          <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] md:grid-cols-[7fr_5fr]">
            <ValueBlock
              num="03"
              kicker="FOR CREATORS"
              title="Your knowledge."
              accent="Your price."
              points={[
                ["Upload once", "Any file format — PDFs to ZIP archives to MP4 releases."],
                ["100% of every sale", "Direct wallet settlement. No platform cut."],
                ["The blob stays yours", "It sits on Walrus. You control the listing object."],
                ["Earnings on-chain", "Settled to your Sui wallet the moment the pass changes hands."],
              ]}
            />
            <ValueBlock
              num="04"
              kicker="FOR BUYERS"
              title="Pay once."
              accent="Own forever."
              points={[
                ["No subscriptions", "One transaction. The pass is yours, permanently."],
                ["Verified ownership", "Tatum RPC checks the pass on every gated download."],
                ["Instant access", "The blob streams direct from the Walrus aggregator."],
                ["Any Sui wallet", "Sui Wallet, Surf, Ethos — anything that speaks Wallet Standard."],
              ]}
            />
          </div>
        </section>
      </main>

      {/* ──────────────── CTA STRIP (ink zone) ──────────────── */}
      <section className="zone-ink relative border-y border-[var(--paper-16)]" id="for">
        <div className="shell grid grid-cols-1 items-stretch gap-10 py-24 md:grid-cols-[7fr_5fr] md:gap-16">
          <div>
            <div className="section-num mb-3">05 — ENTRY POINT</div>
            <h2 className="display text-[clamp(28px,7vw,64px)]" style={{ color: "var(--paper)" }}>
              Start selling files
              <br />
              <span style={{ color: "var(--signal)" }}>on Walrus today.</span>
            </h2>
            <p className="mono mt-6 max-w-[56ch] text-[14px] leading-7 text-[var(--paper-60)]">
              Join the creators and builders monetising digital assets on the
              first decentralised file marketplace built natively on Sui.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link className="button-primary" href="/marketplace">
                [ EXPLORE MARKETPLACE ]
              </Link>
              <Link className="button-secondary" href="/upload">
                [ UPLOAD MY FIRST FILE ]
              </Link>
            </div>
          </div>

          {/* Right column: brutalist status / nav panel */}
          <div className="flex flex-col gap-6 border border-[var(--paper-16)] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="section-num">[ STATUS ]</span>
              <span
                className="mono inline-flex items-center gap-2 text-[11px] tracking-[0.18em]"
                style={{ color: "var(--signal)" }}
              >
                ● ONLINE
              </span>
            </div>

            <StackPills />

            <div className="ascii-rule" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[11px]">
              <dt className="mono tracking-[0.18em] text-[var(--paper-40)]">CHAIN</dt>
              <dd className="mono text-right text-[var(--paper)]">SUI · TESTNET</dd>
              <dt className="mono tracking-[0.18em] text-[var(--paper-40)]">STORAGE</dt>
              <dd className="mono text-right text-[var(--paper)]">WALRUS</dd>
              <dt className="mono tracking-[0.18em] text-[var(--paper-40)]">RPC</dt>
              <dd className="mono text-right text-[var(--paper)]">TATUM</dd>
              <dt className="mono tracking-[0.18em] text-[var(--paper-40)]">BUILD</dt>
              <dd
                className="mono text-right"
                style={{ color: "var(--paper)", fontVariantNumeric: "tabular-nums" }}
              >
                {buildTs.slice(0, 10)}
              </dd>
            </dl>

            <div className="ascii-rule" />

            <div className="flex flex-col gap-2 text-[12px]">
              <Link
                className="mono flex items-center justify-between border-b border-[var(--paper-16)] pb-2 tracking-[0.12em] text-[var(--paper)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
                href="/marketplace"
              >
                <span>BROWSE MARKETPLACE</span>
                <span className="text-[var(--paper-40)]">/01</span>
              </Link>
              <Link
                className="mono flex items-center justify-between border-b border-[var(--paper-16)] pb-2 tracking-[0.12em] text-[var(--paper)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
                href="/upload"
              >
                <span>UPLOAD A FILE</span>
                <span className="text-[var(--paper-40)]">/02</span>
              </Link>
              <Link
                className="mono flex items-center justify-between border-b border-[var(--paper-16)] pb-2 tracking-[0.12em] text-[var(--paper)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
                href="/library"
              >
                <span>YOUR LIBRARY</span>
                <span className="text-[var(--paper-40)]">/03</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/** Streamed listings block — keeps the hero off the Sui RPC's critical path. */
async function MarketplacePreview() {
  const listings = await getMarketplaceListings();

  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-[var(--ink-40)] p-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-num">EMPTY STATE</div>
          <h3 className="display mt-3 text-[clamp(28px,4vw,40px)]">
            No listings yet.
          </h3>
          <p className="mono mx-auto mt-4 max-w-[52ch] text-[13px] leading-7 text-[var(--ink-60)]">
            Upload a file, register a Walrus blob, and your access pass
            will appear here. The grid waits for the first signal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="button-primary" href="/upload">
              [ UPLOAD THE FIRST FILE ]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] md:grid-cols-2 xl:grid-cols-4">
      {listings.slice(0, 4).map((item, index) => (
        <div className="bg-[var(--paper)]" key={item.passId}>
          <ListingCard item={item} priority={index < 2} />
        </div>
      ))}
    </div>
  );
}

function MarketplacePreviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-px bg-[var(--ink-16)] md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="bg-[var(--paper)] p-8" key={i}>
          <div className="ascii-rule mb-4" />
          <div className="mono text-[11px] tracking-[0.18em] text-[var(--ink-40)]">
            [ LOADING · LISTING_{String(i + 1).padStart(2, "0")} ]
          </div>
          <div className="mt-6 h-32 border border-dashed border-[var(--ink-16)]" />
          <div className="mt-4 h-3 w-3/4 bg-[var(--ink-08)]" />
          <div className="mt-2 h-3 w-1/2 bg-[var(--ink-08)]" />
        </div>
      ))}
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mono text-[9px] tracking-[0.24em] text-[var(--paper-40)]">
        {k}
      </span>
      <span className="mono text-[12px] tracking-[0.06em] text-[var(--paper)]">
        {v}
      </span>
    </div>
  );
}

function CornerMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute ${className}`}
      style={{
        width: 14,
        height: 14,
        borderTop: "1.5px solid rgba(250,247,240,0.75)",
        borderLeft: "1.5px solid rgba(250,247,240,0.75)",
        zIndex: 20,
      }}
    />
  );
}

function ValueBlock({
  num,
  kicker,
  title,
  accent,
  points,
}: {
  num: string;
  kicker: string;
  title: string;
  accent: string;
  points: readonly (readonly [string, string])[];
}) {
  return (
    <div className="bg-[var(--paper)] p-10 md:p-14">
      <div className="mb-6 flex items-center gap-3">
        <span className="section-num">{num}</span>
        <span className="ascii-rule flex-1" />
        <span className="tag tag-signal">[ {kicker} ]</span>
      </div>
      <h2 className="display text-[clamp(36px,4vw,56px)]">
        {title}
        <br />
        <span style={{ color: "var(--signal-deep)" }}>{accent}</span>
      </h2>
      <ul className="mt-10 grid grid-cols-1 gap-6">
        {points.map(([head, body]) => (
          <li className="grid grid-cols-[auto_1fr] items-baseline gap-4" key={head}>
            <span className="mono text-[12px] tracking-[0.12em] text-[var(--signal-deep)]">
              ✓
            </span>
            <div>
              <div className="mono text-[13px] font-medium tracking-[0.04em]">
                {head}
              </div>
              <div className="mono mt-1 text-[12px] leading-[1.7] text-[var(--ink-60)]">
                {body}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
