import { Transaction } from "@mysten/sui/transactions";

type TransactionEvent = {
  type?: string;
  parsedJson?: unknown;
};

type TransactionObjectChange = {
  type?: string;
  objectId?: string;
  objectType?: string;
  owner?: unknown;
};

type TransactionLike = {
  events?: TransactionEvent[] | null;
  objectChanges?: TransactionObjectChange[] | null;
};

export type ListingCreatedEvent = {
  listing_id?: string;
  pass_id?: string;
};

export type ListingPurchasedEvent = {
  listing_id?: string;
  pass_id?: string;
};

export type BlobRegisteredEvent = {
  blob_object_id?: string;
  storage_start_epoch?: string | number;
  storage_end_epoch?: string | number;
  royalty_bps?: string | number;
};

export type AccessPointerMintedEvent = {
  pass_id?: string;
  royalty_paid_mist?: string | number;
  storage_end_epoch?: string | number;
};

function getPackageId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_PACKAGE_ID || "";
}

function getEcosystemId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_KIOSK_ECOSYSTEM_ID || "";
}

function getRegistryId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_REGISTRY_ID || "";
}

function getWalrusTopUpTarget() {
  return process.env.NEXT_PUBLIC_WALRUS_TOP_UP_TARGET || "";
}

function getWalrusSystemObjectId() {
  return process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID || "";
}

function assertConfig() {
  const packageId = getPackageId();
  const ecosystemId = getEcosystemId();

  if (!packageId || !ecosystemId) {
    throw new Error(
      "BlobPass Sui environment is incomplete. Add NEXT_PUBLIC_BLOBPASS_PACKAGE_ID and NEXT_PUBLIC_BLOBPASS_KIOSK_ECOSYSTEM_ID.",
    );
  }

  return {
    packageId,
    ecosystemId,
  };
}

function assertRegistryConfig() {
  const config = assertConfig();
  const registryId = getRegistryId();

  if (!registryId) {
    throw new Error(
      "BlobPass registry is not configured. Add NEXT_PUBLIC_BLOBPASS_REGISTRY_ID after publishing the upgraded Move package.",
    );
  }

  return {
    ...config,
    registryId,
  };
}

function eventType(name: string) {
  return `${getPackageId()}::access_pass::${name}`;
}

function findEvent<T>(transaction: TransactionLike, name: string) {
  const match = transaction.events?.find((event) => event.type === eventType(name));
  return (match?.parsedJson ?? null) as T | null;
}

export function buildCreateListingTransaction(input: {
  title: string;
  description: string;
  fileSize: string;
  fileType: string;
  previewImageUrl: string;
  walrusBlobId: string;
  priceMist: string;
}) {
  const { packageId, ecosystemId } = assertConfig();
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::access_pass::create_listing`,
    arguments: [
      tx.object(ecosystemId),
      tx.pure.string(input.title),
      tx.pure.string(input.description),
      tx.pure.string(input.fileSize),
      tx.pure.string(input.fileType),
      tx.pure.string(input.previewImageUrl),
      tx.pure.string(input.walrusBlobId),
      tx.pure.u64(input.priceMist),
    ],
  });

  return tx;
}

export function buildCreateRegisteredListingTransaction(input: {
  title: string;
  description: string;
  fileSize: string;
  fileType: string;
  previewImageUrl: string;
  walrusBlobId: string;
  fileHashBytes: number[];
  storageEpochs: number;
  priceMist: string;
}) {
  const { packageId, ecosystemId, registryId } = assertRegistryConfig();
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::access_pass::create_registered_listing`,
    arguments: [
      tx.object(registryId),
      tx.object(ecosystemId),
      tx.pure.string(input.title),
      tx.pure.string(input.description),
      tx.pure.string(input.fileSize),
      tx.pure.string(input.fileType),
      tx.pure.string(input.previewImageUrl),
      tx.pure.string(input.walrusBlobId),
      tx.pure.vector("u8", input.fileHashBytes),
      tx.pure.u64(input.storageEpochs),
      tx.pure.u64(input.priceMist),
    ],
  });

  return tx;
}

export function buildBuyListingTransaction(input: {
  listingId: string;
  priceMist: string;
  listingInitialSharedVersion?: string;
}) {
  const { packageId } = assertConfig();
  const tx = new Transaction();
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.priceMist)]);
  const listingArg = input.listingInitialSharedVersion
    ? tx.sharedObjectRef({
        objectId: input.listingId,
        initialSharedVersion: input.listingInitialSharedVersion,
        mutable: true,
      })
    : tx.object(input.listingId);

  tx.moveCall({
    target: `${packageId}::access_pass::buy_listing`,
    arguments: [listingArg, paymentCoin],
  });

  return tx;
}

export function buildMintAccessPointerTransaction(input: {
  fileHashBytes: number[];
  royaltyMist: string;
}) {
  const { packageId, registryId } = assertRegistryConfig();
  const tx = new Transaction();
  const [royaltyCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.royaltyMist)]);

  tx.moveCall({
    target: `${packageId}::access_pass::mint_access_pointer`,
    arguments: [tx.object(registryId), tx.pure.vector("u8", input.fileHashBytes), royaltyCoin],
  });

  return tx;
}

export function buildStorageTopUpTransaction(input: {
  fileHashBytes: number[];
  additionalEpochs: number;
  topUpMist: string;
  blobObjectId?: string;
}) {
  const { packageId, registryId } = assertRegistryConfig();
  const tx = new Transaction();
  const topUpTarget = getWalrusTopUpTarget();
  const walrusSystemObjectId = getWalrusSystemObjectId();

  tx.moveCall({
    target: `${packageId}::access_pass::extend_registered_storage`,
    arguments: [
      tx.object(registryId),
      tx.pure.vector("u8", input.fileHashBytes),
      tx.pure.u64(input.additionalEpochs),
    ],
  });

  if (topUpTarget && walrusSystemObjectId && input.blobObjectId) {
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.topUpMist)]);

    tx.moveCall({
      target: topUpTarget,
      arguments: [
        tx.object(walrusSystemObjectId),
        tx.object(input.blobObjectId),
        tx.pure.u64(input.additionalEpochs),
        paymentCoin,
      ],
    });
  }

  return tx;
}

export function getListingCreatedEvent(transaction: TransactionLike) {
  return findEvent<ListingCreatedEvent>(transaction, "ListingCreated");
}

export function getListingPurchasedEvent(transaction: TransactionLike) {
  return findEvent<ListingPurchasedEvent>(transaction, "ListingPurchased");
}

export function getBlobRegisteredEvent(transaction: TransactionLike) {
  return findEvent<BlobRegisteredEvent>(transaction, "BlobRegistered");
}

export function getAccessPointerMintedEvent(transaction: TransactionLike) {
  return findEvent<AccessPointerMintedEvent>(transaction, "AccessPointerMinted");
}

export function getCreatedListingChange(transaction: TransactionLike) {
  return (
    transaction.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        typeof change.objectType === "string" &&
        change.objectType.endsWith("::access_pass::Listing"),
    ) ?? null
  );
}

export function getCreatedPassChange(transaction: TransactionLike) {
  return (
    transaction.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        typeof change.objectType === "string" &&
        change.objectType.endsWith("::access_pass::DataAccessPass"),
    ) ?? null
  );
}

export function getTransferredPassChange(transaction: TransactionLike) {
  return (
    transaction.objectChanges?.find(
      (change) =>
        change.type === "transferred" &&
        typeof change.objectType === "string" &&
        change.objectType.endsWith("::access_pass::DataAccessPass"),
    ) ?? null
  );
}

export function getInitialSharedVersionFromChange(change: TransactionObjectChange | null) {
  if (!change || !change.owner || typeof change.owner !== "object") {
    return "";
  }

  const owner = change.owner as { Shared?: { initial_shared_version?: string } };
  return owner.Shared?.initial_shared_version ?? "";
}

function extractPassIdFromValue(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;

  if (typeof record.id === "string" && record.id.startsWith("0x")) {
    return record.id;
  }

  const directNestedId = record.id;
  if (
    directNestedId &&
    typeof directNestedId === "object" &&
    "id" in (directNestedId as Record<string, unknown>) &&
    typeof (directNestedId as Record<string, unknown>).id === "string"
  ) {
    return String((directNestedId as Record<string, unknown>).id);
  }

  for (const nested of Object.values(record)) {
    const found = extractPassIdFromValue(nested);
    if (found) {
      return found;
    }
  }

  return "";
}

export function extractPassIdFromListingObject(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const content = data.content as Record<string, unknown> | undefined;
  const fields = content?.fields as Record<string, unknown> | undefined;
  const pass = fields?.pass;

  return pass ? extractPassIdFromValue(pass) : "";
}
