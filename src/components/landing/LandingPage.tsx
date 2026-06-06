import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Database,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";
import { ListingCard } from "@/components/cards";
import { Footer, Header, StackPills } from "@/components/chrome";
import { getMarketplaceListings } from "@/lib/blobpass/ledger";
import { AccessControlSection } from "./AccessControlSection";
import { RabbitScene } from "./RabbitScene";
import { TerminalSection } from "./TerminalSection";

export async function LandingPage() {
  const listings = await getMarketplaceListings();

  return (
    <div className="font-mono">
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.96)_46%,rgba(0,22,20,0.82)_100%)]" />
        <Header landing />
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[1280px] items-center px-4">
          <section className="grid w-full grid-cols-1 items-center justify-center gap-7 py-10 lg:grid-cols-[minmax(300px,390px)_56px_minmax(440px,580px)] lg:gap-9">
            <div className="relative flex min-h-[350px] items-center justify-center lg:min-h-[540px]">
              <RabbitScene className="h-[350px] w-full max-w-[300px] cursor-grab touch-none bg-transparent active:cursor-grabbing lg:h-[540px] lg:max-w-[390px] [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full" />
            </div>

            <div className="hidden h-3.5 w-13 border-y-[3px] border-b-cyan-300/15 border-t-cyan-300/30 lg:block" />

            <div className="mx-auto max-w-[620px] text-center lg:mx-0 lg:text-left lg:translate-x-[15%]">
              <span className="inline-flex min-w-40 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/6 px-5 py-2 text-xs font-extrabold text-cyan-300">
                Ecosystem First
              </span>
              <h1 className="mt-5 text-[clamp(40px,9vw,72px)] font-black leading-[0.98] text-white lg:text-[clamp(48px,5.4vw,72px)]">
                Sell Digital
                <br />
                Files Stored
                <br />
                on <span className="text-cyan-300">Walrus</span>
              </h1>
              <p className="mt-5 max-w-[590px] text-lg leading-snug text-zinc-400 lg:text-xl">
                The first premium marketplace for the Sui ecosystem. Monetize your code,
                designs, and data with durable, decentralized storage.
              </p>
              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  className="inline-flex min-h-14 min-w-[190px] items-center justify-center gap-3 rounded-full border border-cyan-300/70 bg-cyan-300 px-9 text-base font-extrabold text-black shadow-[0_0_36px_rgba(34,211,238,0.18)] transition hover:translate-y-[-1px] hover:border-cyan-200 hover:bg-cyan-200"
                  href="/marketplace"
                >
                  <ArrowRight size={18} /> Marketplace
                </Link>
                <Link
                  className="inline-flex min-h-14 min-w-[190px] items-center justify-center gap-3 rounded-full border border-cyan-300/40 bg-black/55 px-9 text-base font-extrabold text-white transition hover:translate-y-[-1px] hover:border-cyan-200 hover:text-cyan-200"
                  href="/upload"
                >
                  <Upload size={18} /> Upload File
                </Link>
              </div>
              <div className="mt-16 flex flex-wrap justify-center gap-7 border-t border-white/10 pt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-400 lg:justify-start">
                <span className="inline-flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300/12 text-cyan-300">
                    <Zap size={16} />
                  </span>
                  Powered by Walrus
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>

      <hr className="border-white/10 opacity-30" />

      <main>
        <div className="border-b border-white/10">
          <AccessControlSection />
        </div>

        <div className="border-y border-white/10" id="how">
          <TerminalSection />
        </div>

        <section className="shell space-y-10 py-32" id="marketplace-preview">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="chip mb-4 px-3 py-1 text-[10px] font-bold tracking-wider">
                TRENDING NOW
              </span>
              <h2 className="title text-[22px] uppercase tracking-widest">Marketplace Preview</h2>
            </div>
            <Link
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-cyan-300"
              href="/marketplace"
            >
              Browse All Listings <ArrowRight size={14} />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {listings.slice(0, 4).map((item) => (
                <ListingCard item={item} key={item.passId} />
              ))}
            </div>
          ) : (
            <div className="panel rounded-[28px] border border-dashed border-cyan-300/25 px-8 py-14 text-center">
              <div className="mx-auto max-w-2xl">
                <h3 className="title text-2xl text-white">Marketplace opens with the first live listing.</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  Upload a file, register the access pass, and your Walrus-backed asset will appear
                  here without any seeded placeholder cards.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link className="button-primary min-h-12 min-w-[190px] rounded-full" href="/marketplace">
                    <ArrowRight size={18} /> Marketplace
                  </Link>
                  <Link className="button-secondary min-h-12 min-w-[190px] rounded-full" href="/upload">
                    <Upload size={18} /> Upload File
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="shell grid gap-8 py-10 md:grid-cols-2" id="stack">
          <div className="panel rounded-3xl p-12">
            <div className="mb-10 grid h-10 w-10 place-items-center rounded-xl border border-cyan-900/50 bg-cyan-950/30 text-cyan-400">
              <Zap size={18} />
            </div>
            <h2 className="title text-3xl leading-snug">
              Your knowledge.
              <br />
              <span className="text-cyan-300">Your price.</span>
            </h2>
            <ul className="mt-12 space-y-8">
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Upload once</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Any file format from PDFs to ZIP archives and MP4 releases.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Get your price in SUI</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    You keep 100% of every sale, instantly.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Your file stays yours</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    The blob stays on Walrus while you control the access listing.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Earnings on-chain</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Direct wallet settlement with zero intermediaries.
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="panel rounded-3xl p-12">
            <div className="mb-10 grid h-10 w-10 place-items-center rounded-xl border border-cyan-900/50 bg-cyan-950/30 text-cyan-400">
              <ShieldCheck size={18} />
            </div>
            <h2 className="title text-3xl leading-snug">
              Pay once.
              <br />
              <span className="text-cyan-300">Own forever.</span>
            </h2>
            <ul className="mt-12 space-y-8">
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">No subscriptions</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    One transaction, and the access pass is yours permanently.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Verified ownership</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    BlobPass checks ownership before every protected download.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Instant access</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Protected blobs stream directly to the buyer after verification passes.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle className="mt-1 shrink-0 text-cyan-400" size={16} />
                <div>
                  <div className="text-[13px] font-bold text-white">Works with any Sui wallet</div>
                  <div className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Sui Wallet, Surf, Ethos, and other Wallet Standard apps can connect directly.
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="shell py-32" id="for">
          <div className="panel relative mx-auto max-w-[900px] overflow-hidden rounded-[40px] p-20 text-center">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />
            <div className="relative z-10 mx-auto mb-10 grid h-16 w-16 place-items-center rounded-2xl bg-cyan-300 text-black">
              <Database size={28} />
            </div>
            <h2 className="title relative z-10 mx-auto max-w-[640px] text-[32px] uppercase tracking-widest leading-snug">
              Start Selling Files on Walrus Today
            </h2>
            <p className="relative z-10 mx-auto mt-6 max-w-lg text-[11px] uppercase tracking-widest leading-6 text-zinc-500">
              Join the growing ecosystem of creators and builders monetizing their digital assets
              on the world&apos;s first decentralized file marketplace.
            </p>
            <div className="relative z-10 mt-14 flex flex-wrap justify-center gap-6">
              <Link className="button-primary min-w-[220px]" href="/marketplace">
                Explore Marketplace
              </Link>
              <Link className="button-secondary min-w-[220px]" href="/upload">
                Upload My First File
              </Link>
            </div>
            <div className="relative z-10 mt-16 flex justify-center opacity-40 grayscale">
              <StackPills />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
