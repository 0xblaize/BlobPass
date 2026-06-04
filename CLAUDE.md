<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**BlobPass** is a Next.js marketplace for digital files stored on Walrus (Sui ecosystem). Sellers upload files to Walrus (decentralized blob storage), list them via Sui Kiosk objects, and buyers verify ownership through Tatum RPC before downloading. Auth is handled by Immutable Passport (OAuth + Ethereum-compatible wallet).

## Commands

```bash
npm run dev      # dev server with Turbopack
npm run build    # production build
npm run lint     # ESLint
npm run start    # production server
```

No test suite is configured yet.

## Architecture

### Data flow (current state — prototype)

All marketplace data is static in [src/lib/data.ts](src/lib/data.ts). There is no backend or API. The `listings[]` and `libraryAssets[]` arrays are the source of truth for all pages. Blob IDs, seller addresses, and prices are mocked.

Auth state comes from `next-auth` via `SessionProvider` (in [src/components/Providers.tsx](src/components/Providers.tsx)) using the Immutable SDK (`@imtbl/auth-next-server` config in [src/lib/auth.ts](src/lib/auth.ts)).

### Routing

| Route | Page file | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Renders `<LandingPage />` |
| `/marketplace` | `src/app/marketplace/page.tsx` | Browse + filter listings |
| `/upload` | `src/app/upload/page.tsx` | 4-step file upload flow (UI only) |
| `/library` | `src/app/library/page.tsx` | User's owned assets and listings |

### Key components

- **[src/components/chrome.tsx](src/components/chrome.tsx)** — `Header`, `Footer`, `Logo`, `StackPills`. Header takes a `landing` boolean prop to switch between the transparent hero variant and the standard nav.
- **[src/components/cards.tsx](src/components/cards.tsx)** — `ListingCard`, `FeatureListing`, `LibraryCard`, `StatCard`. All read from the `Listing` type defined in `data.ts`.
- **[src/components/ConnectWalletButton.tsx](src/components/ConnectWalletButton.tsx)** — uses `useImmutableSession()` hook; calls `connectWallet({ getUser })` on auth success to get an Ethereum-compatible provider, then `eth_requestAccounts`.
- **[src/components/landing/RabbitScene.tsx](src/components/landing/RabbitScene.tsx)** — Three.js interactive 3D rabbit (`/public/rabbit.glb`). Handles pointer capture for drag rotation, auto-rotates on hover, disposes all GPU resources on unmount.
- **[src/components/landing/TerminalSection.tsx](src/components/landing/TerminalSection.tsx)** — "How it Works" section with three animated terminal windows (Walrus upload → Sui Kiosk → Tatum verify). Uses `IntersectionObserver` to start the cycle on scroll-in; auto-cycles every 4–5s.

### Styling conventions

Global CSS variables and reusable utility classes are all in [src/app/globals.css](src/app/globals.css):
- `.shell` — `max-width: 1280px` centered container
- `.panel` — dark gradient card background + border
- `.button-primary` / `.button-secondary` — standard CTA styles
- `.chip` — pill badge (cyan)
- `.title` — Space Mono font, 700 weight

Primary accent is `--cyan: #00f0ff`. Body font is Work Sans; monospace/titles use Space Mono.

`'use client'` is required on any component using hooks, wallet state, Three.js, or browser APIs (`ConnectWalletButton`, `Providers`, `RabbitScene`, `TerminalSection`).

### Environment variables

```
NEXT_PUBLIC_IMMUTABLE_CLIENT_ID=
NEXT_PUBLIC_IMMUTABLE_REDIRECT_URI=   # e.g. https://yoursite.com/api/auth/callback/immutable
```

Both are `NEXT_PUBLIC_` (exposed to the browser). Auth callbacks hit `/api/auth/...` (Next.js API routes, not yet implemented).

## What's not built yet

- Backend / API layer — upload, purchase, and listing endpoints
- Real Walrus blob upload/download
- Sui Move contract interaction (Kiosk minting, KioskOwnerCap transfer)
- Tatum RPC ownership verification
- `/api/auth/` callback routes for Immutable Passport
