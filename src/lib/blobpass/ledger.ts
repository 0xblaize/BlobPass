import { dateLabel, formatBytes, mistToSui, shortAddress, shortBlob } from "./format";
import {
  findRegistryPassByBlobId,
  getRegistryPass,
  getRegistryPassByListingId,
  getRegistrySellerEarnings,
  indexRegistryListing,
  listRegistryInventory,
  listRegistryMarketplacePasses,
  syncRegistryPurchase,
  verifyRegistryOwnership,
} from "./registry";
import type {
  DataAccessPassFields,
  DataAccessPassObject,
  LibraryAssetView,
  LibraryStats,
  MarketplaceListing,
} from "./types";

type CreatePassInput = {
  sellerAddress?: string;
  title: string;
  description: string;
  category: string;
  priceMist: string;
  assetFilename: string;
  storageSource: "local" | "walrus";
  fields: DataAccessPassFields;
};

function getBlobPassPackageId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_PACKAGE_ID || "";
}

function getPlatformKioskId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_KIOSK_ECOSYSTEM_ID || "";
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
    id: pass.listingId,
    passId: pass.id,
    listingId: pass.listingId,
    listingInitialSharedVersion: pass.listingInitialSharedVersion,
    title: fields.title,
    category: pass.category,
    description: fields.description,
    seller: shortAddress(pass.seller),
    price: mistToSui(pass.priceMist),
    priceMist: pass.priceMist,
    size: formatBytes(fields.file_size),
    fileType: fields.file_type,
    purchases: `${pass.purchases}+`,
    previewImageUrl: fields.preview_image_url,
    previewBlobLabel: fields.preview_image_url ? "Public preview" : "Walrus preview pending",
    date: dateLabel(pass.createdAt),
    gradient: pass.gradient,
    source: pass.source,
  };
}

function mapPassToLibraryAsset(pass: DataAccessPassObject, address: string): LibraryAssetView {
  const fields = pass.content.fields;
  const normalizedAddress = address.toLowerCase();
  const listedByUser = Boolean(address) && pass.listed && pass.seller.toLowerCase() === normalizedAddress;
  const owned = Boolean(address) && !listedByUser && pass.owner.toLowerCase() === normalizedAddress;

  return {
    passId: pass.id,
    listingId: pass.listingId,
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
    source: pass.source,
  };
}

export async function getMarketplaceListings() {
  const passes = await listRegistryMarketplacePasses();
  return passes.map(mapPassToMarketplaceListing);
}

export async function getLibraryAssets(address = "") {
  const passes = await listRegistryInventory(address);
  return passes.map((pass) => mapPassToLibraryAsset(pass, address));
}

export function getLibraryStats(assets: LibraryAssetView[]): LibraryStats {
  const owned = assets.filter((asset) => asset.status === "Owned").length;
  const activeListings = assets.filter((asset) => asset.status === "Your Listing").length;

  return {
    ownedAssets: String(owned),
    activeListings: String(activeListings),
    totalEarnings: activeListings > 0 ? `${activeListings * 25}.00 SUI` : "0.00 SUI",
  };
}

export async function getLibraryStatsForAddress(address: string): Promise<LibraryStats> {
  const assets = await getLibraryAssets(address);
  const earnings = await getRegistrySellerEarnings(address);
  const activeListings = assets.filter((asset) => asset.status === "Your Listing").length;
  const owned = assets.filter((asset) => asset.status === "Owned").length;

  return {
    ownedAssets: String(owned),
    activeListings: String(activeListings),
    totalEarnings: `${mistToSui(earnings)} SUI`,
  };
}

type IndexAccessPassInput = CreatePassInput & {
  passId: string;
  listingId: string;
  listingInitialSharedVersion?: string;
  transactionDigest?: string;
};

export async function indexAccessPassListing(input: IndexAccessPassInput) {
  const pass = await indexRegistryListing({
    ...input,
    passId: input.passId,
    listingId: input.listingId,
    listingInitialSharedVersion: input.listingInitialSharedVersion,
    transactionDigest: input.transactionDigest,
  });

  return {
    pass,
    listing: mapPassToMarketplaceListing(pass),
  };
}

export async function syncPurchasedAccessPass({
  listingId,
  buyerAddress,
  passId,
  transactionDigest,
}: {
  listingId: string;
  buyerAddress: string;
  passId?: string;
  transactionDigest?: string;
}) {
  const pass = await syncRegistryPurchase({
    listingId,
    buyerAddress,
    passId,
    transactionDigest,
  });

  if (!pass) {
    return null;
  }

  return {
    pass,
    asset: mapPassToLibraryAsset(pass, buyerAddress),
  };
}

export async function getDataAccessPass(passId: string) {
  return getRegistryPass(passId);
}

export async function getDataAccessPassByBlobId(blobId: string) {
  return findRegistryPassByBlobId(blobId);
}

export async function getDataAccessPassByListingId(listingId: string) {
  return getRegistryPassByListingId(listingId);
}

export function getNativeSuiConfig() {
  const missing: string[] = [];

  if (!getBlobPassPackageId()) {
    missing.push("NEXT_PUBLIC_BLOBPASS_PACKAGE_ID");
  }

  if (!getPlatformKioskId()) {
    missing.push("NEXT_PUBLIC_BLOBPASS_KIOSK_ECOSYSTEM_ID");
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}

export async function verifyAccessPassOwnership(address: string, passId: string) {
  const registryPass = await getRegistryPass(passId);

  if (registryPass?.verificationMode === "registry") {
    return verifyRegistryOwnership(address, passId);
  }

  const tatumRpcUrl = getTatumRpcUrl();

  if (!process.env.TATUM_SUI_RPC_URL && !process.env.NEXT_PUBLIC_TATUM_SUI_RPC) {
    return false;
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
