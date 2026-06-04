import Link from "next/link";
import {
  Bell,
  Blocks,
  Database,
  Globe,
  Library,
  Search,
  Twitter,
  Upload,
} from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";

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
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 text-black">
        <Blocks size={20} />
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
          <div className="flex items-center gap-4">
          
            <Link className="button-secondary hide-mobile min-h-12 rounded-full border-cyan-300/50 bg-black px-7 text-base" href="/upload">
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
        <div className="ml-auto hidden h-11 min-w-[280px] items-center gap-3 rounded-lg border border-white/15 bg-zinc-950 px-4 text-zinc-400 md:flex">
          <Search size={18} />
          <span>Search files...</span>
        </div>
        <Bell className="hide-mobile text-zinc-200" size={22} />
        <div className="hide-mobile h-10 w-px bg-white/15" />
        <ConnectWalletButton />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 pt-24 pb-16 mt-32 text-sm text-zinc-400">
      <div className="shell grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="space-y-6">
          <Logo />
          <p className="max-w-xs text-[11px] leading-6 text-zinc-500">
            The decentralized gateway for digital commerce on the Sui ecosystem. Powered by Walrus Storage.
          </p>
          <div className="text-[10px] text-zinc-600 mt-16">
            © 2024 BlobPass. Built for the decentralized future.
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-white">Marketplace</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="hover:text-cyan-300 transition-colors" href="#">All Files</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Latest Listings</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Top Sellers</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Verified Only</Link>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-white">Developers</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="hover:text-cyan-300 transition-colors" href="#">API Docs</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">SDKs</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Walrus Integration</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Tatum RPC</Link>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-white">Company</h4>
          <div className="flex flex-col gap-4 text-[11px] font-bold tracking-wider">
            <Link className="hover:text-cyan-300 transition-colors" href="#">About</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Privacy Policy</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Terms of Service</Link>
            <Link className="hover:text-cyan-300 transition-colors" href="#">Contact</Link>
          </div>
        </div>
      </div>
      <div className="shell mt-12 flex justify-end gap-6 text-zinc-600">
         <a className="hover:text-cyan-300" href="#"><Globe size={16} /></a>
         <a className="hover:text-cyan-300" href="#"><Twitter size={16} /></a>
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
