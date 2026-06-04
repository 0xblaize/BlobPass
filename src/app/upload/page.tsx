import {
  ArrowRight,
  CheckCircle,
  Database,
  FileText,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import { Footer, Header, StackPills } from "@/components/chrome";

const flow = [
  { label: "Upload", icon: Upload, active: true },
  { label: "Metadata", icon: FileText },
  { label: "Walrus Store", icon: Database },
  { label: "Mint & List", icon: CheckCircle },
];

export default function UploadPage() {
  return (
    <>
      <Header active="upload" />
      <main className="shell py-16">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="title text-5xl md:text-6xl">
              List New <span className="text-cyan-300">Asset</span>
            </h1>
            <p className="mt-4 text-xl text-zinc-400">
              Three steps. Zero middlemen. Your files, your profit.
            </p>
          </div>
          <StackPills />
        </section>

        <section className="mt-16">
          <div className="grid gap-4 md:grid-cols-4">
            {flow.map((step) => {
              const Icon = step.icon;
              return (
                <div className="relative text-center" key={step.label}>
                  <div
                    className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${
                      step.active
                        ? "border-cyan-300 bg-cyan-300/12 text-cyan-300"
                        : "border-white/20 bg-black text-zinc-400"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div
                    className={`mt-4 text-sm font-black uppercase ${
                      step.active ? "text-cyan-300" : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl">
          <div className="panel rounded-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-8">
              <div>
                <h2 className="title text-2xl">Select File</h2>
                <p className="mt-2 text-zinc-400">
                  Securely upload your digital asset to the Walrus network.
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-300">
                1
              </div>
            </div>
            <div className="space-y-7 p-8">
              <div className="grid min-h-[320px] place-items-center rounded-xl border border-dashed border-white/18 bg-white/[0.02] p-8 text-center">
                <div>
                  <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full bg-cyan-300/12 text-cyan-300">
                    <Upload size={34} />
                  </div>
                  <h3 className="title text-2xl">Drag & Drop Digital Asset</h3>
                  <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-400">
                    Support for ZIP, PDF, MP4, datasets, code archives, prompt
                    packs, and 3D models. Maximum file size 2GB.
                  </p>
                  <button className="button-secondary mt-8">Browse Files</button>
                </div>
              </div>

              <div className="flex gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm leading-6 text-zinc-400">
                <ShieldCheck className="shrink-0 text-cyan-300" size={22} />
                <p>
                  Files are encrypted and stored across the Walrus decentralized
                  network. Once uploaded, access is updated through the Sui
                  object model and verified with Tatum RPC.
                </p>
              </div>

              <div className="flex justify-end">
                <button className="button-primary min-h-16 px-10 text-lg opacity-70">
                  Continue to Metadata <ArrowRight size={20} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-4 border-t border-white/10 p-6 text-sm text-zinc-400">
              <span>Awaiting local file system...</span>
              <div className="flex gap-5">
                <a href="#">Privacy Policy</a>
                <a href="#">Storage Terms</a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            { icon: Database, title: "Permanent Storage", text: "Walrus ensures files remain available even if centralized servers go down." },
            { icon: CheckCircle, title: "Sui Verification", text: "Ownership and access rights are transparently managed by the Sui blockchain." },
            { icon: Wallet, title: "Direct Payments", text: "Sellers receive SUI directly into their wallets after every purchase." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div className="panel rounded-lg p-7" key={item.title}>
                <Icon className="mb-6 text-cyan-300" size={28} />
                <h3 className="title text-lg">{item.title}</h3>
                <p className="mt-4 leading-7 text-zinc-400">{item.text}</p>
              </div>
            );
          })}
        </section>
      </main>
      <Footer />
    </>
  );
}
