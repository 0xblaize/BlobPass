import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Zap,
  FileUp,
  Database,
  LockKeyhole,
  Coins,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { Header, Footer, StackPills } from "@/components/chrome";
import { RabbitScene } from "./RabbitScene";
import { ListingCard } from "@/components/cards";
import { listings } from "@/lib/data";

const steps = [
  {
    icon: FileUp,
    title: "Upload",
    text: "Drag and drop any file. It's erasure-coded and distributed across Walrus nodes.",
  },
  {
    icon: Database,
    title: "Store",
    text: "Your file becomes a permanent 'blob'. Immutable and always available.",
  },
  {
    icon: LockKeyhole,
    title: "Access Pass",
    text: "Mint a Sui Kiosk object that acts as the cryptographic key for buyers.",
  },
  {
    icon: Coins,
    title: "List",
    text: "Set your price in SUI. Our smart contracts handle the exchange automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Unlock",
    text: "Buyers pay once to permanently lock the file access to their Sui wallet.",
  },
];

export function LandingPage() {
  return (
    <div className="font-mono">
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.96)_46%,rgba(0,22,20,0.82)_100%)]" />
        <Header landing />
        {/* --- HERO SECTION --- */}
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
                The first premium marketplace for the Sui ecosystem. Monetize
                your code, designs, and data with immutable, decentralized
                storage.
              </p>
              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  className="inline-flex min-h-14 min-w-[180px] items-center justify-center gap-3 rounded-full border border-cyan-300/65 bg-black/45 px-9 text-base font-extrabold text-white transition hover:border-cyan-200 hover:text-cyan-200"
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
        {/* --- HOW IT WORKS SECTION --- */}
        <section id="how" className="border-y border-white/10 py-32">
          <div className="shell space-y-20 text-center">
            <div>
              <h2 className="title text-2xl tracking-widest uppercase">
                Streamlined Access Control
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[11px] text-zinc-500">
                No database. No AWS bill. No backend. Just smart contracts and
                decentralized storage nodes handling everything.
              </p>
            </div>
            <div className="relative">
              <div className="absolute top-[24px] left-[10%] right-[10%] h-px border-t border-dashed border-white/15" />
              <div className="grid gap-6 md:grid-cols-5 relative z-10">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div className="space-y-4 text-center" key={step.title}>
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#090b0e] border border-white/5 text-zinc-400">
                        <Icon size={18} />
                      </div>
                      <div className="text-[10px] font-black uppercase text-cyan-300 tracking-widest">
                        Step 0{index + 1}
                      </div>
                      <h3 className="title text-[13px] uppercase tracking-wider">
                        {step.title}
                      </h3>
                      <p className="text-[11px] leading-5 text-zinc-500 max-w-[180px] mx-auto">
                        {step.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* --- MARKETPLACE PREVIEW SECTION --- */}
        <section className="shell space-y-10 py-32">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="chip mb-4 text-[10px] px-3 py-1 font-bold tracking-wider">
                TRENDING NOW
              </span>
              <h2 className="title text-[22px] uppercase tracking-widest">
                Marketplace Preview
              </h2>
            </div>
            <Link
              className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2"
              href="/marketplace"
            >
              Browse All Listings <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {listings.slice(0, 4).map((item) => (
              <ListingCard item={item} key={item.id} />
            ))}
          </div>
        </section>

        {/* --- VALUE PROPOSITION SECTION --- */}
        <section id="stack" className="shell grid gap-8 md:grid-cols-2 py-10">
          <div className="panel rounded-3xl p-12">
            <div className="mb-10 grid h-10 w-10 place-items-center rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-900/50">
              <Zap size={18} />
            </div>
            <h2 className="title text-3xl leading-snug">
              Your knowledge.
              <br />
              <span className="text-cyan-300">Your price.</span>
            </h2>
            <ul className="mt-12 space-y-8">
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Upload once
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Any file format up to any size — PDF, ZIP, MP4.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Get your price in SUI
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    You keep 100% of every sale, instantly.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Your file stays yours
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    The blob stays on Walrus forever — delist freely.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Earnings on-chain
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Direct wallet settlement with zero intermediaries.
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="panel rounded-3xl p-12">
            <div className="mb-10 grid h-10 w-10 place-items-center rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-900/50">
              <ShieldCheck size={18} />
            </div>
            <h2 className="title text-3xl leading-snug">
              Pay once.
              <br />
              <span className="text-cyan-300">Own forever.</span>
            </h2>
            <ul className="mt-12 space-y-8">
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    No subscriptions
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    One transaction — the access pass is yours permanently.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Verified ownership
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Tatum RPC confirms your Kiosk object before every download.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Instant access
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Blob retrieved directly from the Walrus aggregator network.
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <CheckCircle
                  size={16}
                  className="text-cyan-400 shrink-0 mt-1"
                />
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Works with any Sui wallet
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Sui Wallet, Surf, Ethos — just connect and pay.
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* --- CALL TO ACTION SECTION --- */}
        <section id="for" className="shell py-32">
          <div className="panel mx-auto max-w-[900px] rounded-[40px] p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="mx-auto mb-10 grid h-16 w-16 place-items-center rounded-2xl bg-cyan-300 text-black relative z-10">
              <Database size={28} />
            </div>
            <h2 className="title text-[32px] uppercase tracking-widest max-w-[640px] mx-auto leading-snug relative z-10">
              Start Selling Files on Walrus Today
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[11px] leading-6 text-zinc-500 uppercase tracking-widest relative z-10">
              Join the growing ecosystem of creators and builders monetizing
              their digital assets on the world&apos;s first decentralized file
              marketplace.
            </p>
            <div className="mt-14 flex flex-wrap justify-center gap-6 relative z-10">
              <Link className="button-primary min-w-[220px]" href="/upload">
                Upload My First File
              </Link>
              <Link
                className="button-secondary min-w-[220px]"
                href="/marketplace"
              >
                Explore Marketplace
              </Link>
            </div>
            <div className="mt-16 flex justify-center opacity-40 grayscale relative z-10">
              <StackPills />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
