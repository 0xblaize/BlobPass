import {
  addDemoListing,
  findDemoPassByBlobId,
  getDemoPass,
  listDemoInventory,
  listDemoMarketplacePasses,
  purchaseDemoPass,
  verifyDemoOwnership,
} from "./demo-store";
import {
  dateLabel,
  DEMO_BUYER_ADDRESS,
  formatBytes,
  mistToSui,
  shortAddress,
  shortBlob,
} from "./format";
import type {
  DataAccessPassFields,
  DataAccessPassObject,
  LibraryAssetView,
  LibraryStats,
  MarketplaceListing,
  TransactionSpec,
} from "./types";

type CreatePassInput = {
  sellerAddress?: string;
  title: string;
  description: string;
  category: string;
  priceMist: string;
  fields: DataAccessPassFields;
};

function getBlobPassPackageId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_PACKAGE_ID || "0xblobpass_demo_package";
}

function getPlatformKioskId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_KIOSK_ECOSYSTEM_ID || "0xblobpass_demo_kiosk";
}

function getTatumRpcUrl() {
  return (
    process.env.TATUM_SUI_RPC_URL ||
    process.env.NEXT_PUBLIC_TATUM_SUI_RPC ||
    process.env.NEXT_PUBLIC_TATUM_SUI_TESTNET_URL ||
    "https://sui-testnet.gateway.tatum.io"
  );
}

function mapPassToMarketplaceListing(pass: DataAccessPassObject): MarketplaceListing {
  const fields = pass.content.fields;

  return {
    id: pass.id,
    passId: pass.id,
    title: fields.title,
    category: pass.category,
    description: fields.description,
    seller: shortAddress(pass.seller),
    sellerKioskId: pass.sellerKioskId,
    listingKioskId: pass.listingKioskId,
    price: mistToSui(pass.priceMist),
    priceMist: pass.priceMist,
    size: formatBytes(fields.file_size),
    fileType: fields.file_type,
    purchases: `${pass.purchases}+`,
    previewImageUrl: fields.preview_image_url,
    previewBlobLabel: fields.preview_image_url ? "Public preview" : "Walrus preview pending",
    date: dateLabel(pass.createdAt),
    gradient: pass.gradient,
    source: "demo",
  };
}

function mapPassToLibraryAsset(pass: DataAccessPassObject, address: string): LibraryAssetView {
  const fields = pass.content.fields;
  const owned = pass.owner.toLowerCase() === address.toLowerCase();
  const listedByUser = pass.listed && pass.seller.toLowerCase() === address.toLowerCase();

  return {
    passId: pass.id,
    title: fields.title,
    category: pass.category,
    status: owned ? "Owned" : listedByUser ? "Your Listing" : "Locked",
    action: owned ? "Download" : listedByUser ? "View Listing" : "Locked",
    price: listedByUser ? `${mistToSui(pass.priceMist)} SUI` : "",
    date: `${owned ? "Acquired" : "Listed"}: ${dateLabel(pass.createdAt)}`,
    blobLabel: shortBlob(pass.id),
    gradient: pass.gradient,
    downloadUrl: owned
      ? `/api/download?passId=${encodeURIComponent(pass.id)}&address=${encodeURIComponent(address)}`
      : undefined,
    rawFileBlobId: owned ? fields.walrus_blob_id : undefined,
    previewImageUrl: fields.preview_image_url,
    source: "demo",
  };
}

export function buildMintAndListTransactionSpec(pass: DataAccessPassObject): TransactionSpec {
  const fields = pass.content.fields;

  return {
    chain: "sui",
    title: `Mint and list ${fields.title}`,
    description:
      "Create the Data Access Pass object, insert it into the seller kiosk, and list it for purchase.",
    packageId: getBlobPassPackageId(),
    kioskId: pass.sellerKioskId,
    requiresWalletSignature: true,
    calls: [
      {
        kind: "moveCall",
        target: `${getBlobPassPackageId()}::access_pass::mint`,
        arguments: {
          title: fields.title,
          description: fields.description,
          file_size: fields.file_size,
          file_type: fields.file_type,
          preview_image_url: fields.preview_image_url,
          walrus_blob_id: fields.walrus_blob_id,
        },
      },
      {
        kind: "kioskAction",
        target: "0x2::kiosk::place_and_list",
        arguments: {
          kiosk: pass.sellerKioskId,
          price_mist: pass.priceMist,
          platform_kiosk: getPlatformKioskId(),
        },
      },
    ],
  };
}

export function buildPurchaseTransactionSpec(pass: DataAccessPassObject): TransactionSpec {
  return {
    chain: "sui",
    title: `Purchase ${pass.content.fields.title}`,
    description:
      "Buy the listed access pass from the seller kiosk and transfer the pass object into the buyer kiosk.",
    packageId: getBlobPassPackageId(),
    kioskId: pass.listingKioskId,
    requiresWalletSignature: true,
    calls: [
      {
        kind: "kioskAction",
        target: "0x2::kiosk::purchase",
        arguments: {
          kiosk: pass.listingKioskId,
          pass_object_id: pass.id,
          price_mist: pass.priceMist,
        },
      },
    ],
  };
}

export async function getMarketplaceListings() {
  return listDemoMarketplacePasses().map(mapPassToMarketplaceListing);
}

export async function getLibraryAssets(address = DEMO_BUYER_ADDRESS) {
  return listDemoInventory(address).map((pass) => mapPassToLibraryAsset(pass, address));
}

export function getLibraryStats(assets: LibraryAssetView[]): LibraryStats {
  const owned = assets.filter((asset) => asset.status === "Owned").length;
  const activeListings = assets.filter((asset) => asset.status === "Your Listing").length;

  return {
    ownedAssets: String(owned),
    activeListings: String(activeListings),
    totalEarnings: `${activeListings * 25}.00 SUI`,
  };
}

export async function createAccessPassListing(input: CreatePassInput) {
  const pass = addDemoListing(input);

  return {
    pass,
    listing: mapPassToMarketplaceListing(pass),
    transaction: buildMintAndListTransactionSpec(pass),
  };
}

export async function purchaseAccessPass(passId: string, buyerAddress: string) {
  const beforePurchase = getDemoPass(passId);

  if (!beforePurchase) {
    return null;
  }

  const transaction = buildPurchaseTransactionSpec(beforePurchase);
  const pass = purchaseDemoPass(passId, buyerAddress);

  if (!pass) {
    return null;
  }

  return {
    pass,
    asset: mapPassToLibraryAsset(pass, buyerAddress),
    transaction,
  };
}

export async function getDataAccessPass(passId: string) {
  return getDemoPass(passId);
}

export async function getDataAccessPassByBlobId(blobId: string) {
  return findDemoPassByBlobId(blobId);
}

export async function verifyAccessPassOwnership(address: string, passId: string) {
  const tatumRpcUrl = getTatumRpcUrl();

  if (!process.env.TATUM_SUI_RPC_URL && !process.env.NEXT_PUBLIC_TATUM_SUI_RPC) {
    return verifyDemoOwnership(address, passId);
  }

  const response = await fetch(tatumRpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.TATUM_API_KEY ? { "x-api-key": process.env.TATUM_API_KEY } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "blobpass-verify-owner",
      method: "sui_getObject",
      params: [
        passId,
        {
          showOwner: true,
          showContent: true,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Tatum Sui RPC failed with HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  const owner = extractSuiAddressOwner(payload);

  return owner ? owner.toLowerCase() === address.toLowerCase() : false;
}

function extractSuiAddressOwner(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as Record<string, unknown>;
  const result = root.result as Record<string, unknown> | undefined;
  const data = result?.data as Record<string, unknown> | undefined;
  const owner = data?.owner as Record<string, unknown> | string | undefined;

  if (typeof owner === "string") {
    return owner;
  }

  const addressOwner = owner?.AddressOwner;
  return typeof addressOwner === "string" ? addressOwner : "";
}
