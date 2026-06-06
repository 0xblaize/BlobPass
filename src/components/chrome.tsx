import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  Blocks,
  Database,
  Library,
  Upload,
} from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { GlobalMarketplaceSearch } from "./GlobalMarketplaceSearch";

type NavProps = {
  active?: "marketplace" | "upload" | "library";
  landing?: boolean;
};

const nav = [
  { href: "/marketplace", label: "Marketplace", key: "marketplace", icon: Blocks },
  { href: "/upload", label: "Upload", key: "upload", icon: Upload },
  { href: "/library", label: "My Library", key: "library", icon: Library },
] as const;

export function Logo() {
  return (
    <Link className="flex items-center gap-2" href="/">
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/35 bg-black/70 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
        <Image
          alt="BlobPass logo"
          className="h-full w-full object-cover"
          height={40}
          priority
          src="/logo.jpg"
          width={40}
        />
      </span>
      <span className="title text-xl text-cyan-300">BlobPass</span>
    </Link>
  );
}

export function Header({ active, landing = false }: NavProps) {
  if (landing) {
    return (
      <header className="relative z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-24 w-full max-w-[1280px] items-center justify-between gap-6 px-4">
          <Logo />
          <nav className="hide-mobile flex items-center gap-10 text-base font-bold text-zinc-400">
            <a href="#how">How It Works</a>
            <a href="#stack">The Stack</a>
            <a href="#for">Who It&apos;s For</a>
          </nav>
          <div className="flex items-center gap-3">
                       <Link
              className="button-secondary hide-mobile min-h-12 min-w-[170px] rounded-full border-cyan-300/40 bg-black/70 px-7 text-base text-zinc-100"
              href="/upload"
            >
              <Upload size={18} /> Upload File
            </Link>
            <ConnectWalletButton />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/88 backdrop-blur">
      <div className="shell flex h-20 items-center gap-6">
        <Logo />
        <nav className="hide-mobile flex items-center gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Link
                className={`inline-flex h-11 items-center gap-3 rounded-lg px-4 font-bold ${
                  isActive
                    ? "bg-cyan-300/14 text-cyan-300"
                    : "text-zinc-400 hover:text-white"
                }`}
                href={item.href}
                key={item.key}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Suspense
          fallback={
            <div className="ml-auto hidden h-11 min-w-[280px] items-center gap-3 rounded-lg border border-white/15 bg-zinc-950 px-4 text-zinc-500 md:flex">
              <SearchPlaceholder />
            </div>
          }
        >
          <GlobalMarketplaceSearch />
        </Suspense>
        <ConnectWalletButton />
      </div>
    </header>
  );
}

function SearchPlaceholder() {
  return (
    <>
      <span className="text-sm">Search marketplace...</span>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-32 border-t border-white/10 pb-16 pt-24 text-sm text-zinc-400">
      <div className="shell grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-6">
          <Logo />
          <p className="max-w-xs text-[11px] leading-6 text-zinc-500">
            The decentralized gateway for digital commerce on the Sui ecosystem. Powered by Walrus Storage.
          </p>
          <div className="mt-16 text-[10px] text-zinc-600">
            Copyright 2026 BlobPass. Built for the decentralized future.
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Marketplace</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="transition-colors hover:text-cyan-300" href="/marketplace">
              All Files
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/marketplace#trending-highlights">
              Trending Highlights
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/marketplace#latest-discoveries">
              Latest Discoveries
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/upload">
              List an Asset
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Developers</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="transition-colors hover:text-cyan-300" href="/upload">
              Upload Flow
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/marketplace">
              Purchase Flow
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/library">
              Download Flow
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/">
              Architecture
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Company</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="transition-colors hover:text-cyan-300" href="/">
              About
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/marketplace">
              Marketplace
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/upload">
              Upload
            </Link>
            <Link className="transition-colors hover:text-cyan-300" href="/library">
              My Library
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function StackPills() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="chip">
        <Database size={14} /> Walrus Storage
      </span>
      <span className="chip border-blue-400/40 bg-blue-400/10 text-blue-300">
        Sui Network
      </span>
      <span className="chip border-violet-400/40 bg-violet-400/10 text-violet-300">
        Tatum RPC
      </span>
    </div>
  );
}
