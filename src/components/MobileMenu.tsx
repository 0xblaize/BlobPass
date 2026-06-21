"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Variant = "landing" | "app";
type ActiveKey = "marketplace" | "upload" | "library";

const APP_LINKS: { href: string; label: string; key: ActiveKey }[] = [
  { href: "/marketplace", label: "MARKETPLACE", key: "marketplace" },
  { href: "/upload", label: "UPLOAD", key: "upload" },
  { href: "/library", label: "LIBRARY", key: "library" },
];

const LANDING_LINKS: { href: string; label: string }[] = [
  { href: "#how", label: "HOW" },
  { href: "#stack", label: "STACK" },
  { href: "#for", label: "AUDIENCE" },
  { href: "/marketplace", label: "MARKETPLACE" },
  { href: "/upload", label: "UPLOAD" },
  { href: "/library", label: "LIBRARY" },
];

export function MobileMenu({
  variant,
  active,
}: {
  variant: Variant;
  active?: ActiveKey;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inverted = variant === "landing";
  // Toggle stays in the header's color so it blends with the header strip.
  const headerText = inverted ? "var(--paper)" : "var(--ink)";
  const headerBorder = inverted ? "var(--paper-40)" : "var(--ink-40)";
  // Panel INVERTS the header's zone so the drop is visibly distinct
  // (dark menu over light page, light menu over dark page).
  const panelBg = inverted ? "var(--paper)" : "var(--ink)";
  const panelText = inverted ? "var(--ink)" : "var(--paper)";
  const panelBorder = inverted ? "var(--ink-16)" : "var(--paper-16)";
  const mutedText = inverted ? "var(--ink-60)" : "var(--paper-60)";

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="mono inline-flex h-10 items-center justify-center border px-3 text-[12px] tracking-[0.16em] md:hidden"
        onClick={() => setOpen((value) => !value)}
        style={{
          borderColor: headerBorder,
          color: headerText,
        }}
        type="button"
      >
        {open ? "[ ✕ ]" : "[ ☰ ]"}
      </button>

      {open ? (
        <div
          className={`fixed inset-x-0 top-14 z-40 md:hidden ${
            inverted ? "zone-paper" : "zone-ink"
          }`}
          style={{
            background: panelBg,
            color: panelText,
            boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
          }}
        >
          <div
            className="border-b border-t"
            style={{ borderColor: panelBorder }}
          >
            <nav className="shell flex flex-col py-6">
              {variant === "app"
                ? APP_LINKS.map((item) => {
                    const isActive = active === item.key;
                    return (
                      <Link
                        className="mono flex items-center justify-between border-b py-4 text-[14px] tracking-[0.18em]"
                        href={item.href}
                        key={item.key}
                        onClick={() => setOpen(false)}
                        style={{
                          borderColor: panelBorder,
                          color: isActive ? panelText : mutedText,
                        }}
                      >
                        <span>{item.label}</span>
                        <span
                          style={{
                            color: isActive ? "var(--signal)" : mutedText,
                          }}
                        >
                          {isActive ? "● ACTIVE" : "→"}
                        </span>
                      </Link>
                    );
                  })
                : LANDING_LINKS.map((item) => (
                    <Link
                      className="mono flex items-center justify-between border-b py-4 text-[14px] tracking-[0.18em]"
                      href={item.href}
                      key={item.href}
                      onClick={() => setOpen(false)}
                      style={{
                        borderColor: panelBorder,
                        color: mutedText,
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ color: mutedText }}>→</span>
                    </Link>
                  ))}

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  className="button-primary text-center"
                  href="/upload"
                  onClick={() => setOpen(false)}
                >
                  [ UPLOAD A FILE ─→ ]
                </Link>
                <Link
                  className="button-secondary text-center"
                  href="/marketplace"
                  onClick={() => setOpen(false)}
                >
                  [ EXPLORE MARKETPLACE ]
                </Link>
              </div>
            </nav>
          </div>
          <button
            aria-label="Close menu backdrop"
            className="block h-screen w-full"
            onClick={() => setOpen(false)}
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
            }}
            type="button"
          />
        </div>
      ) : null}
    </>
  );
}
