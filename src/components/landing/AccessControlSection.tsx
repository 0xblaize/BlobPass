import { FileUp, Database, Lock, Link2, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: FileUp,
    number: "01",
    label: "Upload",
    description:
      "Drag and drop any file. It's erasure-coded and distributed across Walrus nodes.",
  },
  {
    icon: Database,
    number: "02",
    label: "Store",
    description:
      "Your file becomes a permanent 'blob'. Immutable and always available.",
  },
  {
    icon: Lock,
    number: "03",
    label: "Access Pass",
    description:
      "Mint a Sui Kiosk object that acts as the cryptographic key for buyers.",
  },
  {
    icon: Link2,
    number: "04",
    label: "List",
    description:
      "Set your price in SUI. Our smart contracts handle the exchange automatically.",
  },
  {
    icon: ShieldCheck,
    number: "05",
    label: "Unlock",
    description:
      "Buyers pay once to permanently lock the file access to their Sui wallet.",
  },
];

export function AccessControlSection() {
  return (
    <section className="shell py-28">
      <div className="text-center mb-20">
        <h2 className="title text-[clamp(22px,4vw,36px)] uppercase tracking-widest">
          Streamlined Access Control
        </h2>
        <p className="mt-4 text-[13px] text-zinc-500 max-w-xl mx-auto leading-relaxed">
          No database. No AWS bill. No backend. Just smart contracts and
          decentralized storage nodes handling everything.
        </p>
      </div>

      <div className="relative flex flex-col gap-12 md:flex-row md:gap-0">
        {/* connector line */}
        <div className="absolute top-[38px] left-0 right-0 hidden md:block">
          <div className="mx-auto h-px w-[calc(100%-120px)] translate-x-[60px] border-t border-dashed border-white/15" />
        </div>

        {steps.map(({ icon: Icon, number, label, description }) => (
          <div
            key={number}
            className="relative z-10 flex flex-1 flex-col items-center text-center px-4"
          >
            <div className="mb-5 grid h-[72px] w-[72px] place-items-center rounded-2xl bg-zinc-900 border border-white/10 text-zinc-300">
              <Icon size={26} />
            </div>
            <span className="text-[10px] font-extrabold tracking-[0.2em] text-cyan-300 uppercase mb-2">
              Step {number}
            </span>
            <div className="title text-[13px] uppercase tracking-wider text-white mb-3">
              {label}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[180px]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
