import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Database,
  Download,
  FileUp,
  Github,
  Globe,
  LockKeyhole,
  ShieldCheck,
  Twitter,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Footer, Header, Logo, StackPills } from "@/components/chrome";
import { ListingCard } from "@/components/cards";
import { listings } from "@/lib/data";
import { RabbitScene } from "@/components/rabbit-scene";

const steps = [
  { icon: FileUp, title: "Upload", text: "Drag any file in. BlobPass prepares it for decentralized storage." },
  { icon: Database, title: "Store", text: "Your file becomes a permanent Walrus blob with durable availability." },
  { icon: LockKeyhole, title: "Access Pass", text: "A Sui object links the buyer to the file access right." },
  { icon: Coins, title: "List", text: "Set your price in SUI and let the marketplace handle purchases." },
  { icon: Download, title: "Unlock", text: "Tatum RPC verifies ownership before every download." },
];

export default function LandingPage() {
  return (
    <>
      <div className="landing-frame">
        <Header landing />
        <main className="landing-main shell">
          <section className="landing-hero">
            <div className="mascot-wrap">
              <div className="mascot-glow" />
              <RabbitScene />
            </div>

            <div className="hero-divider" />

            <div className="landing-copy">
              <span className="eyebrow-pill">Ecosystem First</span>
              <h1>
                Sell Digital
                <br />
                Files Stored
                <br />
                on <span>Walrus</span>
              </h1>
              <p>
                The first premium marketplace for the Sui ecosystem. Monetize
                your code, designs, and data with immutable, decentralized
                storage.
              </p>
              <div className="landing-actions">
                <Link className="button-primary landing-primary" href="/marketplace">
                  Explore Marketplace <ArrowRight size={21} />
                </Link>
                <Link className="button-secondary landing-secondary" href="/upload">
                  Upload File
                </Link>
              </div>
              <div className="landing-meta">
                <span>
                  <Zap size={18} /> Powered by Walrus
                </span>
                <span>
                  <Users size={18} /> 12K+ Collectors
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>

      <main>
        <section id="how" className="border-y border-white/10 py-24">
          <div className="shell space-y-14 text-center">
            <div>
              <h2 className="title text-3xl">Streamlined Access Control</h2>
              <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
                No database. No manual links. Just smart contracts and
                decentralized storage nodes handling every access check.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-5">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className="space-y-4" key={step.title}>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-zinc-900 text-cyan-300">
                      <Icon size={22} />
                    </div>
                    <div className="text-xs font-black uppercase text-cyan-300">
                      Step 0{index + 1}
                    </div>
                    <h3 className="title text-xl">{step.title}</h3>
                    <p className="text-sm leading-6 text-zinc-400">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="shell space-y-8 py-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="chip mb-3">Trending Now</span>
              <h2 className="title text-3xl">Marketplace Preview</h2>
            </div>
            <Link className="font-bold text-cyan-300" href="/marketplace">
              Browse All Listings <ArrowRight className="inline" size={17} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {listings.slice(0, 4).map((item) => (
              <ListingCard item={item} key={item.id} />
            ))}
          </div>
        </section>

        <section id="stack" className="bg-white/[0.03] py-24">
          <div className="shell grid gap-8 md:grid-cols-2">
            <div className="panel rounded-xl p-10">
              <Wallet className="mb-8 text-cyan-300" size={32} />
              <h2 className="title text-3xl">
                Your knowledge. <span className="block text-cyan-300">Your price.</span>
              </h2>
              <ul className="mt-8 space-y-5 text-zinc-300">
                <li>Upload once to Walrus storage.</li>
                <li>Set your price in SUI.</li>
                <li>Keep direct onchain earnings.</li>
              </ul>
            </div>
            <div className="panel rounded-xl p-10">
              <ShieldCheck className="mb-8 text-cyan-300" size={32} />
              <h2 className="title text-3xl">
                Pay once. <span className="block text-cyan-300">Own forever.</span>
              </h2>
              <ul className="mt-8 space-y-5 text-zinc-300">
                <li>No subscriptions or shared download links.</li>
                <li>Tatum RPC confirms the access pass.</li>
                <li>Works with any Sui wallet.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="for" className="shell py-28">
          <div className="panel mx-auto max-w-4xl rounded-2xl p-12 text-center">
            <div className="mx-auto mb-7 grid h-14 w-14 place-items-center rounded-xl bg-cyan-300 text-black">
              <Database />
            </div>
            <h2 className="title text-4xl">Start Selling Files on Walrus Today</h2>
            <p className="mx-auto mt-5 max-w-xl text-zinc-400">
              Built for trading templates, prompt packs, reports, datasets,
              design assets, coding resources, e-books, and educational files.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link className="button-primary" href="/upload">
                Upload My First File
              </Link>
              <Link className="button-secondary" href="/marketplace">
                Explore Marketplace
              </Link>
            </div>
            <div className="mt-8 flex justify-center">
              <StackPills />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
