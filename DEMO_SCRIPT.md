# BlobPass — 5 Minute Demo Script

Target length: 5:00. Each beat has a rough time budget, the screen action, and what you say. Read it once out loud first — adjust anything that doesn't sound like you.

---

## 0:00 — 0:25 · Hook + one-liner

**Show:** Landing page, the brutalist hero with the rabbit. Don't move the cursor yet.

**Say:**
> "Right now, if you want to sell a file on chain, you have two bad options. Pin it to IPFS yourself and pray nobody unpins it, or rent S3 and call it 'decentralized' in the marketing. BlobPass is the third option. It's a marketplace for paid digital files where the storage layer is Walrus, the access ledger is a Move contract on Sui, and the ownership receipt is an NFT-style pass that lives in your wallet. No backend holds the file. No backend gates the download. You own the pass, you get the bytes."

---

## 0:25 — 1:00 · The architecture in one breath

**Show:** Scroll once to the "How" / "Stack" section of the landing page so the protocol names are visible.

**Say:**
> "Three pieces. One — Walrus stores the encrypted blob and gives me a content-addressed ID. Two — a Move package on Sui mints two things per upload: a Listing object that points at the Walrus blob, and a DataAccessPass that gets transferred to the buyer on purchase. Three — the Next.js app on the screen reads the chain through Tatum's Sui RPC and proxies Walrus blobs only after it verifies the caller's wallet actually owns a matching pass. The download endpoint is the only gate, and the gate logic is `sui_getObject` against the buyer's wallet. There's no off-chain access list to spoof."

---

## 1:00 — 2:15 · Upload + on-chain registration

**Show:** Click UPLOAD. Pick a small image or PDF. Fill in title, description, category, price, edition cap, storage epochs.

**Say while filling:**
> "I'll upload a file. Title, price in SUI, category, and two things that are unusual — edition cap and storage epochs. Edition cap is how many access passes can ever exist for this file. The Move contract enforces it; if I set it to 5, the sixth `buy_listing` call aborts with `EEditionSoldOut`. That's a property the contract guarantees, not something my UI promises. Storage epochs is how long Walrus is paid to keep the blob alive — I can top it up later from my library."

**Show:** Click submit, sign the wallet popup.

**Say while it signs:**
> "When I sign, the file goes to a Walrus publisher, comes back with a blob ID, then `create_registered_listing` runs on Sui. That call emits a `ListingCreated` and `BlobRegistered` event in the same transaction. The frontend reads those events to get the shared `Listing` object ID and indexes the listing locally so I don't have to wait 30 seconds for the next chain-index poll."

**Show:** Listing appears in marketplace.

---

## 2:15 — 3:15 · Marketplace + buy + detail page

**Show:** Marketplace catalog. Click the title of any listing to open the new asset detail page.

**Say:**
> "Every listing is a real shared object on chain. Click the title — this is the new OpenSea-style detail page. Preview, full description, the price in SUI, the file size, the file type, the royalty cut, the edition count remaining. Down here — uploader address, current seller, current holder, all linked to SuiVision. Storage health: which epoch the blob is paid through and how many days are left. And the on-chain block — pass ID, listing ID, blob object, file hash, last transaction digest, all linked out. Everything you'd want to verify before buying is one click away from the page that's selling it to you."

**Show:** Click BUY INSTANT ACCESS, sign in wallet.

**Say:**
> "Buy runs `buy_listing` — splits the price from gas, hands the coin to the contract, the contract validates the edition cap and transfers a fresh DataAccessPass to my address. Royalties from any resale automatically route back to the original uploader, not whoever happens to be holding the pass when it sells. That's encoded in the Move module, not in a TOS."

---

## 3:15 — 4:15 · Library + list-from-library + storage top-up

**Show:** Open LIBRARY. The pass just bought shows up as "Owned".

**Say:**
> "Library is everything my wallet holds plus everything it's listing. The on-chain ownership check runs against Sui directly — I'm not reading a database. For an owned pass I get a download button, and the new piece — I can resell it without going back through upload. Click LIST FOR SALE, set a price, confirm."

**Show:** Click LIST FOR SALE, type a price like 2.5, click confirm, sign.

**Say while signing:**
> "That runs `list_owned_pass`, which transfers the pass from my wallet into a new shared `Listing` object owned by the contract. The marketplace catalog picks it up on the next refresh. No new upload, no re-encryption — same blob, new seller."

**Show:** Top up storage button on a pass.

**Say:**
> "And here — if my pass's Walrus storage is running low, TOP UP +1EP extends the blob's storage window on-chain. The contract takes a small royalty for the original uploader on every renewal. That means the file outliving the seller's interest doesn't kill the asset."

---

## 4:15 — 4:50 · Why this works

**Show:** Stay on the library. Slow scroll.

**Say:**
> "What I want you to take from this. The marketplace doesn't have a database that, if it goes down, kills your access. The download endpoint can't lie about ownership because it asks the chain. The supply cap is a contract invariant, not a UI promise. The storage layer is replaceable — I could swap Walrus for Filecoin and the buyer wouldn't know. The only thing the buyer trusts is their own wallet and the Move package, and the Move package is open source."

---

## 4:50 — 5:00 · Close

**Show:** Landing page.

**Say:**
> "BlobPass. Files on Walrus, access on Sui, no middleman to bribe. Thanks for watching."

---

## Cheat sheet — terms you may stumble on

- **Walrus** — Mysten's decentralized blob storage on top of Sui.
- **Mist** — Sui's smallest denomination. 1 SUI = 1,000,000,000 mist.
- **Epoch** — Sui's ~24h time unit. Walrus storage windows are priced per epoch.
- **Move** — Sui's smart contract language. The marketplace logic lives in `access_pass.move`.
- **Shared object** — A Sui object multiple wallets can write to. `Listing` is shared so any buyer can call `buy_listing` on it.
- **Object change / event** — Two ways Sui transactions surface what they did. We parse both.

## Things to NOT say

- "Encrypted on Walrus." Walrus blobs aren't encrypted by default in the demo flow. The access gate is ownership, not encryption.
- "Decentralized" more than once. Once is the point, twice is filler.
- "Like OpenSea but…" Frame it as a primitive for paid files, not as a JPEG marketplace.

## Backup talking points if you have extra time

- Verified-creator badge logic and how the original-uploader address travels with the pass even after a resale.
- The Tatum RPC choice: faster and rate-limit-friendlier than the public Mysten endpoint, no auth required from the user.
- Why the supply cap had to live in Move and not in the frontend — show the `EEditionSoldOut` abort code.
- Mobile pass: pass through the marketplace on a phone preview to show it doesn't collapse.

## Things to NOT demo

- Edge case error UIs (wallet RPC dropouts, sold-out clicks). They're handled but not interesting on video.
- The 3D rabbit. It's set dressing, not the point.
- Settings, env vars, or anything that requires reading code on screen.
