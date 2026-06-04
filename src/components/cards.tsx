import {
  ArrowRight,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MoreHorizontal,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { Listing } from "@/lib/data";

export function ListingCard({ item }: { item: Listing }) {
  return (
    <article className="panel overflow-hidden rounded-lg">
      <div className={`asset-image relative h-44 bg-gradient-to-br ${item.gradient}`}>
        <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-black text-cyan-300">
          WALRUS
        </span>
        <span className="absolute bottom-4 left-4 rounded-full border border-cyan-300/50 bg-cyan-400/30 px-3 py-1 text-xs font-bold text-cyan-100">
          {item.category}
        </span>
        <ImageIcon
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400/70"
          size={52}
        />
      </div>
      <div className="space-y-4 p-5">
        <h3 className="text-xl font-black">{item.title}</h3>
        <p className="min-h-12 text-sm leading-6 text-zinc-400">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{item.seller}</span>
          <span>{item.date}</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-zinc-400">PRICE</div>
            <div className="title text-2xl text-cyan-300">{item.price} SUI</div>
          </div>
          <button className="button-primary min-h-10 px-4 text-sm">Buy Access</button>
        </div>
      </div>
    </article>
  );
}

export function FeatureListing({ item }: { item: Listing }) {
  return (
    <article className="panel grid gap-5 rounded-xl border-cyan-300/30 p-6 md:grid-cols-[220px_1fr]">
      <div className={`asset-image relative min-h-56 rounded-lg bg-gradient-to-br ${item.gradient}`} />
      <div className="flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-cyan-300 text-black">Featured</span>
            <span className="chip">Walrus Storage</span>
          </div>
          <h2 className="title text-2xl leading-tight">{item.title}</h2>
          <p className="leading-7 text-zinc-300">{item.description} Processed via Sui-parallel clusters.</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-bold text-zinc-500">SELLER</div>
              <div>{item.seller}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500">SIZE</div>
              <div>{item.size}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500">PURCHASES</div>
              <div>{item.purchases}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="title text-3xl text-cyan-300">{item.price} SUI</div>
          <button className="button-primary">
            Buy Instant Access <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function LibraryCard({
  asset,
}: {
  asset: {
    title: string;
    category: string;
    status: string;
    action: string;
    price: string;
    date: string;
    blob: string;
    gradient: string;
  };
}) {
  const owned = asset.status === "Owned";

  return (
    <article className="panel overflow-hidden rounded-lg">
      <div className={`asset-image relative h-48 bg-gradient-to-br ${asset.gradient}`}>
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${
            owned ? "bg-cyan-300 text-black" : "bg-black text-white"
          }`}
        >
          {asset.status}
        </span>
        <span className="absolute bottom-3 right-3 rounded-md border border-white/15 bg-black/70 px-3 py-1 text-xs font-black">
          WALRUS ONLINE
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-cyan-300">{asset.category}</div>
            <h3 className="mt-1 text-xl font-black">{asset.title}</h3>
          </div>
          <MoreHorizontal size={20} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs text-zinc-400">
          <span>{asset.date}</span>
          <span>{asset.blob}</span>
        </div>
        {asset.price ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">List Price</span>
            <strong className="text-cyan-300">{asset.price}</strong>
          </div>
        ) : null}
        <button className={owned ? "button-primary w-full" : "button-secondary w-full"}>
          {owned ? <Download size={17} /> : <ExternalLink size={17} />}
          {asset.action}
        </button>
      </div>
    </article>
  );
}

export function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="panel rounded-lg p-7">
      <div className="mb-8 flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-black text-cyan-300">{icon}</div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-400">
          Live Stats
        </span>
      </div>
      <div className="text-xs font-black uppercase text-zinc-500">{label}</div>
      <div className="title mt-1 text-3xl">{value}</div>
      <p className="mt-4 text-sm text-zinc-400">{note}</p>
    </div>
  );
}

export const cardIcons = { ShieldCheck, Wallet };
