import Link from "next/link";
import {
  Bell,
  Blocks,
  Database,
  Github,
  Globe,
  Library,
  Search,
  Twitter,
  Upload,
} from "lucide-react";

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
      <header className="landing-header">
        <div className="shell flex h-24 items-center justify-between gap-6">
          <Logo />
          <nav className="hide-mobile flex items-center gap-10 text-base font-bold text-zinc-400">
            <a href="#how">How It Works</a>
            <a href="#stack">The Stack</a>
            <a href="#for">Who It&apos;s For</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link className="hide-mobile text-base font-bold text-zinc-400" href="/marketplace">
              Explore Marketplace
            </Link>
            <Link className="button-secondary hide-mobile min-h-12 rounded-full border-cyan-300/50 bg-black px-7 text-base" href="/upload">
              <Upload size={18} /> Upload File
            </Link>
            <Link className="button-primary min-h-12 rounded-full px-8 text-base" href="/marketplace">
              Connect Wallet
            </Link>
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
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="font-bold">0x7a...4e21</div>
            <div className="text-xs font-bold text-cyan-300">Connected</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 via-sky-200 to-zinc-700 ring-2 ring-white/20" />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 text-sm text-zinc-400">
      <div className="shell flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <Logo />
            <p className="mt-1 text-zinc-400">The standard for decentralized asset distribution on the Sui blockchain.</p>
          </div>
        </div>

        <div className="flex items-center gap-6" aria-label="Social links">
          <a href="#" aria-label="Twitter">
            <Twitter size={18} />
          </a>
          <a href="#" aria-label="GitHub">
            <Github size={18} />
          </a>
          <a href="#" aria-label="Website">
            <Globe size={18} />
          </a>
        </div>

        <p className="text-zinc-400">© 2026 BlobPass. Built for Walrus Storage.</p>
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
