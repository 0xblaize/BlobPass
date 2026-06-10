BlobPass

BlobPass is a decentralized, zero-trust data delivery and content monetization platform built for the **Tatum x Sui with Walrus Hackathon**. It establishes secure, token-gated access control for digital content, datasets, and files by decoupling the storage layer from the commerce layer.

By leveraging native **Sui Kiosk** primitives for asset management, **Walrus** for immutable decentralized storage, and **Tatum RPC** infrastructure for high-speed on-chain verification, BlobPass eliminates the need for creators to rely on centralized servers or unvetted, custom marketplace contracts to secure their intellectual property.

---

## 🏗️ System Architecture

BlobPass operates on a three-tier decentralized architecture designed for efficiency, speed, and absolute access control:

1. **Storage Layer (Walrus):** Creators upload large files or datasets directly through the BlobPass client interface. The file is stored immutably on Walrus nodes, returning a cryptographic `blob_id`. The actual file contents are never stored on-chain or on a centralized server.
2. **Commerce & Rights Layer (Sui Kiosk):** Instead of custom, risky marketplace logic, BlobPass wraps the `blob_id` access rights into a standard Sui Object and deposits it into a native Sui Kiosk container. This allows assets to be listed, traded, or transferred using native Sui commerce primitives.
3. **Verification Layer (Tatum RPC):** When a user requests a file download, the BlobPass backend utilizes high-speed Tatum RPC nodes to dynamically index and query the Sui blockchain. It verifies that the user's connected wallet currently owns the specific Kiosk Object required for access. Once verified, the application streams the data directly from Walrus storage nodes to the user.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Smart Contracts / Assets:** Sui Move, Native Sui Kiosk SDK
- **Decentralized Storage:** Walrus Protocol (HTTP API / CLI)
- **Blockchain Infrastructure:** Tatum RPC Nodes (Sui Testnet)

---

## 🚀 Local Setup & Installation

Since a demo video is unavailable for this submission, please follow these instructions to spin up the project locally and evaluate the integration end-to-end.

### Prerequisites
- Node.js (v18.x or higher)
- pnpm / npm / yarn
- A Sui wallet (e.g., Sui Wallet or Surf Wallet) configured to **Testnet** with test tokens.

###1. Clone the Repository

git clone [https://github.com/your-username/blobpass.git](https://github.com/your-username/blobpass.git)
cd blobpass

2. Install Dependencies
 
 pnpm install
# or npm install / yarn install

3. Environment Variables
Create a .env.local file in the root directory and populate it with your Tatum credentials and Walrus endpoints:

NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_TATUM_API_KEY=your_tatum_api_key_here
NEXT_PUBLIC_WALRUS_PUBLISHER=[https://publisher.walrus-testnet.walrus.space](https://publisher.walrus-testnet.walrus.space)
NEXT_PUBLIC_WALRUS_AGGREGATOR=[https://aggregator.walrus-testnet.walrus.space](https://aggregator.walrus-testnet.walrus.space)

4. Run the Development Server
pnpm dev
# or npm run dev

Open http://localhost:3000 in your browser to interact with the application.

🕹️ Verification Guide (How to Test)

Step 1: The Creator Flow (Upload)
Connect your Sui wallet via the top-right connect button.
Navigate to the Dashboard and select a file to upload.
Hit Upload. The file will be sent directly to Walrus. You can verify the generated blob_id inside your browser console or network tab.
Confirm the wallet transaction to mint the Access Pass and list it on the marketplace using native Sui Kiosk primitives.

Step 2: The Buyer Flow (Purchase & Download)
Switch to a separate wallet account or use a tester account.
Navigate to the Marketplace view. The application queries the Kiosk system via Tatum RPC to display active listings.
Click Purchase Pass and sign the transaction.
Once ownership is transferred on-chain, click Download Content.
The backend instantly uses Tatum to verify the asset is inside your Kiosk container, pulls the corresponding blob_id from the object metadata, and fetches the secure data stream straight from Walrus.

📄 Hackathon Submission Note
Due to unexpected production constraints near the deadline, we were unable to finalize our short video demonstration. We sincerely apologize for this missing asset.
We have made sure our local installation steps are frictionless and completely transparent so judges and developers can pull the repository and verify the architecture manually. All core features—including Walrus file processing and Tatum RPC node queries—are fully operational in this codebase.

