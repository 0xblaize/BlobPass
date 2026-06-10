export type BlobPassRuntimeSource = "local" | "walrus" | "tatum" | "registry" | "hybrid";

export type BlobVisibility = "public" | "hidden";

export type AccessPassVerificationMode = "registry" | "tatum-object-owner";

export type StorageHealth = "healthy" | "expiring" | "expired" | "unknown";

export type DataAccessPassFields = {
  title: string;
  description: string;
  file_size: string;
  file_type: string;
  preview_image_url: string;
  walrus_blob_id: string;
};

export type DataAccessPassObject = {
  id: string;
  listingId: string;
  listingInitialSharedVersion?: string;
  blobObjectId?: string;
  owner: string;
  seller: string;
  category: string;
  priceMist: string;
  createdAt: string;
  purchases: number;
  gradient: string;
  listed: boolean;
  source: BlobPassRuntimeSource;
  storageSource: Extract<BlobPassRuntimeSource, "local" | "walrus">;
  verificationMode: AccessPassVerificationMode;
  assetFilename: string;
  fileHash: string;
  originalUploader: string;
  royaltyBps: number;
  storageStartEpoch: number;
  storageEndEpoch: number;
  storageEpochDurationDays: number;
  storageRegisteredAt: string;
  storageTopUps: number;
  storageRoyaltyMist: string;
  pointer: boolean;
  duplicateOfPassId?: string;
  lastTransactionDigest?: string;
  lastStorageTopUpDigest?: string;
  content: {
    fields: DataAccessPassFields;
  };
};

export type UploadReceipt = {
  blobId: string;
  blobObjectId?: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  visibility: BlobVisibility;
  source: BlobPassRuntimeSource;
  storageEpochs: number;
  storageEndEpoch?: number;
};

export type TransactionCallSpec = {
  kind: "moveCall" | "kioskAction";
  target: string;
  arguments: Record<string, string | number | boolean | null>;
};

export type TransactionSpec = {
  chain: "sui";
  title: string;
  description: string;
  packageId: string;
  kioskId: string;
  calls: TransactionCallSpec[];
  requiresWalletSignature: boolean;
};

export type MarketplaceListing = {
  id: string;
  passId: string;
  listingId: string;
  listingInitialSharedVersion?: string;
  blobObjectId?: string;
  title: string;
  category: string;
  description: string;
  seller: string;
  price: string;
  priceMist: string;
  size: string;
  fileType: string;
  purchases: string;
  previewImageUrl: string;
  previewBlobLabel: string;
  date: string;
  gradient: string;
  source: BlobPassRuntimeSource;
  fileHash: string;
  storageEndEpoch: number;
  storageEpochDurationDays: number;
  storageDaysRemaining: number;
  storageHealth: StorageHealth;
  royaltyBps: number;
};

export type LibraryAssetView = {
  passId: string;
  listingId: string;
  blobObjectId?: string;
  title: string;
  category: string;
  status: "Owned" | "Your Listing" | "Locked";
  action: string;
  price: string;
  date: string;
  blobLabel: string;
  gradient: string;
  downloadUrl?: string;
  rawFileBlobId?: string;
  previewImageUrl: string;
  source: BlobPassRuntimeSource;
  fileHash: string;
  storageStartEpoch: number;
  storageEndEpoch: number;
  storageEpochDurationDays: number;
  storageDaysRemaining: number;
  storageHealth: StorageHealth;
  storageRenewalLabel: string;
  royaltyBps: number;
};

export type LibraryStats = {
  ownedAssets: string;
  activeListings: string;
  totalEarnings: string;
};
