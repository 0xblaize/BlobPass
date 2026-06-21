import Link from "next/link";
import { Suspense } from "react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { GlobalMarketplaceSearch } from "./GlobalMarketplaceSearch";
import { MobileMenu } from "./MobileMenu";

type NavProps = {
  active?: "marketplace" | "upload" | "library";
  landing?: boolean;
};

const nav = [
  { href: "/marketplace", label: "MARKETPLACE", key: "marketplace" },
  { href: "/upload", label: "UPLOAD", key: "upload" },
  { href: "/library", label: "LIBRARY", key: "library" },
] as const;

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link className="group inline-flex items-baseline gap-2" href="/">
      <span
        className={`mono text-xs font-bold tracking-[0.18em] ${
          inverted ? "text-[var(--paper)]" : "text-[var(--ink)]"
        }`}
      >
        [BP]
      </span>
      <span
        className={`mono text-sm font-bold tracking-[0.24em] ${
          inverted ? "text-[var(--paper)]" : "text-[var(--ink)]"
        }`}
      >
        BLOBPASS
      </span>
      <span className="mono text-[10px] tracking-[0.18em] text-[var(--signal-deep)] group-hover:text-[var(--signal)]">
        v0.1
      </span>
    </Link>
  );
}

export function Header({ active, landing = false }: NavProps) {
  if (landing) {
    return (
      <header className="zone-ink relative z-20 border-b border-[var(--paper-16)]">
        <div className="shell flex h-14 items-center justify-between gap-3 md:gap-6">
          <Logo inverted />
          <nav className="hide-mobile mono flex items-center gap-5 text-[12px] tracking-[0.18em] text-[var(--paper-60)]">
            <a className="hover:text-[var(--paper)]" href="#how">
              HOW
            </a>
            <span className="text-[var(--paper-40)]">·</span>
            <a className="hover:text-[var(--paper)]" href="#stack">
              STACK
            </a>
            <span className="text-[var(--paper-40)]">·</span>
            <a className="hover:text-[var(--paper)]" href="#for">
              AUDIENCE
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="button-secondary hide-mobile" href="/upload">
              [ UPLOAD ]
            </Link>
            <ConnectWalletButton />
            <MobileMenu variant="landing" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="zone-paper sticky top-0 z-50 border-b border-[var(--ink-16)] backdrop-blur">
      <div className="shell flex h-14 items-center gap-3 md:gap-6">
        <Logo />
        <nav className="hide-mobile mono flex items-center gap-4 text-[12px] tracking-[0.18em]">
          {nav.map((item, i) => {
            const isActive = active === item.key;
            return (
              <div className="flex items-center gap-4" key={item.key}>
                {i > 0 && <span className="text-[var(--ink-40)]">·</span>}
                <Link
                  className={
                    isActive
                      ? "text-[var(--ink)] underline decoration-[var(--signal)] decoration-2 underline-offset-[6px]"
                      : "text-[var(--ink-60)] hover:text-[var(--ink)]"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <Suspense
          fallback={
            <div className="mono ml-auto hidden h-9 min-w-[260px] items-center gap-2 border border-[var(--ink-40)] px-3 text-[12px] text-[var(--ink-40)] md:flex">
              <span className="text-[var(--signal-deep)]">&gt;</span>
              <span>search marketplace_</span>
            </div>
          }
        >
          <GlobalMarketplaceSearch />
        </Suspense>
        <div className="ml-auto flex items-center gap-3 md:ml-0 md:gap-6">
          <ConnectWalletButton />
          <MobileMenu variant="app" active={active} />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="zone-ink relative mt-32 border-t border-[var(--paper-16)] pb-16 pt-16">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-[2fr_1px_1fr_1px_1fr_1px_1fr]">
          <div className="space-y-6">
            <Logo inverted />
            <p className="mono max-w-xs text-[12px] leading-6 text-[var(--paper-60)]">
              A decentralised access ledger for files stored on Walrus, gated by
              native Sui passes.
            </p>
            <div className="ascii-rule max-w-xs" />
            <StackPills />
            <div className="mono pt-8 text-[10px] tracking-[0.16em] text-[var(--paper-40)]">
              © 2026 BLOBPASS · BUILT FOR THE OPEN PROTOCOL ERA
            </div>
          </div>
          <div className="hidden md:block">
            <div className="h-full w-px bg-[var(--paper-16)]" />
          </div>
          <FootCol
            label="[ MARKET ]"
            links={[
              ["All files", "/marketplace"],
              ["Trending", "/marketplace#trending-highlights"],
              ["Latest", "/marketplace#latest-discoveries"],
              ["List asset", "/upload"],
            ]}
          />
          <div className="hidden md:block">
            <div className="h-full w-px bg-[var(--paper-16)]" />
          </div>
          <FootCol
            label="[ DEVS ]"
            links={[
              ["Upload flow", "/upload"],
              ["Purchase flow", "/marketplace"],
              ["Download flow", "/library"],
              ["Architecture", "/"],
            ]}
          />
          <div className="hidden md:block">
            <div className="h-full w-px bg-[var(--paper-16)]" />
          </div>
          <FootCol
            label="[ ORG ]"
            links={[
              ["About", "/"],
              ["Marketplace", "/marketplace"],
              ["Upload", "/upload"],
              ["Library", "/library"],
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function FootCol({
  label,
  links,
}: {
  label: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-4">
      <h4 className="mono text-[11px] font-medium tracking-[0.24em] text-[var(--paper)]">
        {label}
      </h4>
      <div className="flex flex-col gap-3">
        {links.map(([label, href]) => (
          <Link
            className="mono text-[12px] tracking-[0.06em] text-[var(--paper-60)] hover:text-[var(--signal)]"
            href={href}
            key={href + label}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StackPills() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="tag tag-signal">[ WALRUS ]</span>
      <span className="tag">[ SUI ]</span>
      <span className="tag">[ TATUM ]</span>
    </div>
  );
}
