# BlobPass

BlobPass is a decentralized, zero-trust data delivery and content monetization platform built for the **Tatum x Sui with Walrus Hackathon**. It establishes secure, token-gated access control for digital content, datasets, and files by decoupling the storage layer from the commerce layer.

BlobPass is built on a **Custom High-Efficiency Move Asset Ledger and Shared Registry**, purpose-built and optimized for Walrus storage operations. Rather than wrapping assets in general-purpose marketplace containers, BlobPass mints lightweight `DataAccessPass` objects and indexes them through a single shared `BlobRegistry` object on Sui. This custom architecture bypasses standard kiosk container overhead, giving fast, direct asset verification: a buyer's access is proven by querying object ownership on-chain, and the registry deduplicates Walrus blobs by content hash so identical files reuse existing storage. Combined with **Walrus** for immutable decentralized storage and **Tatum RPC** infrastructure for high-speed on-chain reads, this lets creators monetize content without centralized servers.

---

## 🏗️ System Architecture

BlobPass operates on a three-tier decentralized architecture designed for efficiency, speed, and absolute access control:

1. **Storage Layer (Walrus):** Creators upload large files or datasets directly through the BlobPass client interface. The file is stored immutably on Walrus nodes, returning a cryptographic `blob_id`. The actual file contents are never stored on-chain or on a centralized server.
2. **Commerce & Rights Layer (Custom Move Ledger + Shared Registry):** The `blobpass::access_pass` Move package mints a `DataAccessPass` object that carries the `blob_id`, file hash, storage window, and royalty terms. Listings are published as shared `Listing` objects, and every registered blob is recorded once in a shared `BlobRegistry` object keyed by file hash. This bespoke ledger avoids generic kiosk container overhead, so listing, purchasing (`buy_listing`), pointer minting (`mint_access_pointer`), and storage extension (`extend_registered_storage`) are direct entry calls against BlobPass-owned objects.
3. **Verification Layer (Tatum RPC):** When a user requests a file download, the BlobPass backend uses high-speed Tatum RPC nodes to query the Sui blockchain directly. It verifies that the user's connected wallet currently owns the specific `DataAccessPass` object required for access. Once ownership is confirmed on-chain, the application streams the data directly from Walrus storage nodes to the user.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Smart Contracts / Assets:** Sui Move — custom `access_pass` package (`DataAccessPass` objects + shared `BlobRegistry`)
- **Decentralized Storage:** Walrus Protocol (HTTP API / CLI)
- **Blockchain Infrastructure:** Tatum RPC Nodes (Sui Testnet)

---

## 🚀 Local Setup & Installation

Since a demo video is unavailable for this submission, please follow these instructions to spin up the project locally and evaluate the integration end-to-end.

### Prerequisites
- Node.js (v18.x or higher)
- pnpm / npm / yarn
- A Sui wallet (e.g., Sui Wallet or Surf Wallet) configured to **Testnet** with test tokens.

### 1. Clone the Repository

git clone [https://github.com/your-username/blobpass.git](https://github.com/your-username/blobpass.git)
cd blobpass

2. Install Dependencies
 
 pnpm install
# or npm install / yarn install

3. Environment Variables
Create a .env.local file in the root directory and populate it with your Tatum credentials, Walrus endpoints, and the published BlobPass package/registry IDs:

NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_TATUM_API_KEY=your_tatum_api_key_here
NEXT_PUBLIC_WALRUS_PUBLISHER=[https://publisher.walrus-testnet.walrus.space](https://publisher.walrus-testnet.walrus.space)
NEXT_PUBLIC_WALRUS_AGGREGATOR=[https://aggregator.walrus-testnet.walrus.space](https://aggregator.walrus-testnet.walrus.space)
NEXT_PUBLIC_BLOBPASS_PACKAGE_ID=0x...        # published access_pass package
NEXT_PUBLIC_BLOBPASS_ECOSYSTEM_ID=0x...      # shared Ecosystem object
NEXT_PUBLIC_BLOBPASS_REGISTRY_ID=0x...       # shared BlobRegistry object

4. Run the Development Server
pnpm dev
# or npm run dev

Open http://localhost:3000 in your browser to interact with the application.

🕹️ Verification Guide (How to Test)

Step 1: The Creator Flow (Upload)
Connect your Sui wallet via the top-right connect button.
Navigate to the Dashboard and select a file to upload.
Hit Upload. The file will be sent directly to Walrus. You can verify the generated blob_id inside your browser console or network tab.
Confirm the wallet transaction to mint the DataAccessPass and publish the Listing through the custom access_pass package, registering the blob in the shared BlobRegistry.

Step 2: The Buyer Flow (Purchase & Download)
Switch to a separate wallet account or use a tester account.
Navigate to the Marketplace view. The local registry acts as a fast indexer of live listings sourced from on-chain events.
Click Purchase Pass and sign the transaction (`buy_listing`).
Once the DataAccessPass is transferred to your wallet on-chain, click Download Content.
The backend uses Tatum RPC to verify your wallet owns the DataAccessPass object, reads the corresponding blob_id from the pass, and fetches the secure data stream straight from Walrus.

📄 Hackathon Submission Note
Due to unexpected production constraints near the deadline, we were unable to finalize our short video demonstration. We sincerely apologize for this missing asset.
We have made sure our local installation steps are frictionless and completely transparent so judges and developers can pull the repository and verify the architecture manually. All core features—including Walrus file processing, the custom on-chain access ledger, and Tatum RPC node queries—are fully operational in this codebase.
