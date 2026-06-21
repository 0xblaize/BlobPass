import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { loadChainPasses } from "./chain-index";
import { DEMO_SELLER_ADDRESS, normalizeAddress, sanitizeFilename, slugify } from "./format";
import type {
  BlobPassRuntimeSource,
  DataAccessPassFields,
  DataAccessPassObject,
} from "./types";

type RegistryState = {
  version: 1;
  sequence: number;
  passes: DataAccessPassObject[];
};

type CreateRegistryListingInput = {
  sellerAddress?: string;
  title: string;
  description: string;
  category: string;
  priceMist: string;
  assetFilename: string;
  storageSource: Extract<BlobPassRuntimeSource, "local" | "walrus">;
  blobObjectId?: string;
  fileHash?: string;
  storageStartEpoch?: number;
  storageEndEpoch?: number;
  storageEpochDurationDays?: number;
  originalUploader?: string;
  royaltyBps?: number;
  totalSupply?: number;
  passesMinted?: number;
  fields: DataAccessPassFields;
};

const REGISTRY_DIR = path.join(process.cwd(), ".blobpass");
const REGISTRY_FILE = path.join(REGISTRY_DIR, "registry.json");

// Vercel/serverless hosts mount the deployment as read-only, so any mkdir or
// writeFile against process.cwd() throws ENOENT/EACCES/EROFS at request time
// and blows up the API route. When we detect a read-only host, we skip the
// local overlay entirely — reads degrade to the on-chain projection, writes
// become no-ops, and the caller still gets a sensible value back.
function isReadOnlyFilesystem() {
  if (process.env.BLOBPASS_REGISTRY_DISABLED === "1") return true;
  // Vercel sets both VERCEL=1 and AWS_LAMBDA_FUNCTION_NAME on serverless invocations.
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return true;
  return false;
}

function isFilesystemError(error: unknown) {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return (
    code === "ENOENT" ||
    code === "ENOTDIR" ||
    code === "EACCES" ||
    code === "EPERM" ||
    code === "EROFS"
  );
}
const DEFAULT_GRADIENTS = [
  "from-cyan-900 via-blue-900 to-zinc-950",
  "from-blue-950 via-slate-900 to-cyan-950",
  "from-slate-950 via-cyan-950 to-zinc-900",
  "from-indigo-950 via-zinc-900 to-cyan-950",
] as const;

const DEFAULT_STORAGE_EPOCHS = 5;
const DEFAULT_TESTNET_EPOCH_DAYS = 14;
const DEFAULT_ROYALTY_BPS = 500;

let registryWriteQueue = Promise.resolve();

function createEmptyRegistry(): RegistryState {
  return {
    version: 1,
    sequence: 1,
    passes: [],
  };
}

function clonePass(pass: DataAccessPassObject): DataAccessPassObject {
  return {
    ...pass,
    content: {
      fields: { ...pass.content.fields },
    },
  };
}

function numberOrDefault(value: unknown, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function stringOrDefault(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getDefaultStorageEpochs() {
  const configured = Number.parseInt(process.env.WALRUS_STORAGE_EPOCHS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_STORAGE_EPOCHS;
}

function getEpochDurationDays() {
  const configured = Number.parseInt(
    process.env.WALRUS_EPOCH_DURATION_DAYS ??
      process.env.NEXT_PUBLIC_WALRUS_EPOCH_DURATION_DAYS ??
      "",
    10,
  );

  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TESTNET_EPOCH_DAYS;
}

function defaultStorageEndEpoch(startEpoch: number) {
  return startEpoch + getDefaultStorageEpochs();
}

function hashFallback(pass: DataAccessPassObject) {
  return pass.fileHash || pass.content.fields.walrus_blob_id || pass.id;
}

function normalizePassRecord(pass: DataAccessPassObject): DataAccessPassObject {
  const createdAt = pass.createdAt || new Date().toISOString();
  const storageStartEpoch = numberOrDefault(pass.storageStartEpoch, 0);
  const storageEpochDurationDays = numberOrDefault(
    pass.storageEpochDurationDays,
    getEpochDurationDays(),
  );
  const totalSupply = Math.max(1, numberOrDefault(pass.totalSupply, 1));
  const passesMinted = Math.max(
    1,
    numberOrDefault(pass.passesMinted, Math.max(1, Number.isFinite(pass.purchases) ? Number(pass.purchases) + 1 : 1)),
  );

  return {
    ...pass,
    id: pass.id || `registry-pass-${Date.now()}`,
    listingId: pass.listingId || pass.id,
    listingInitialSharedVersion: pass.listingInitialSharedVersion || "",
    blobObjectId: pass.blobObjectId || "",
    owner: pass.owner || pass.seller || DEMO_SELLER_ADDRESS,
    seller: pass.seller || DEMO_SELLER_ADDRESS,
    category: pass.category || "Digital Asset",
    priceMist: pass.priceMist || "0",
    createdAt,
    purchases: Number.isFinite(pass.purchases) ? pass.purchases : 0,
    gradient: pass.gradient || DEFAULT_GRADIENTS[0],
    listed: Boolean(pass.listed),
    source: pass.source || "registry",
    storageSource: pass.storageSource || "local",
    verificationMode: pass.verificationMode || "registry",
    assetFilename: pass.assetFilename || `${sanitizeFilename(pass.content.fields.title)}.bin`,
    fileHash: hashFallback(pass),
    originalUploader: pass.originalUploader || pass.seller || DEMO_SELLER_ADDRESS,
    royaltyBps: numberOrDefault(pass.royaltyBps, DEFAULT_ROYALTY_BPS),
    storageStartEpoch,
    storageEndEpoch: numberOrDefault(
      pass.storageEndEpoch,
      defaultStorageEndEpoch(storageStartEpoch),
    ),
    storageEpochDurationDays,
    storageRegisteredAt: pass.storageRegisteredAt || createdAt,
    storageTopUps: numberOrDefault(pass.storageTopUps, 0),
    storageRoyaltyMist: stringOrDefault(pass.storageRoyaltyMist, "0"),
    pointer: Boolean(pass.pointer),
    duplicateOfPassId: pass.duplicateOfPassId || "",
    lastStorageTopUpDigest: pass.lastStorageTopUpDigest || "",
    totalSupply,
    passesMinted,
    content: {
      fields: {
        ...pass.content.fields,
      },
    },
  };
}

async function ensureRegistryDir() {
  await mkdir(REGISTRY_DIR, { recursive: true });
}

async function readRegistry(): Promise<RegistryState> {
  if (isReadOnlyFilesystem()) {
    return createEmptyRegistry();
  }

  try {
    const raw = await readFile(REGISTRY_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<RegistryState>;

    return {
      version: 1,
      sequence: Number.isFinite(parsed.sequence) ? Number(parsed.sequence) : 1,
      passes: Array.isArray(parsed.passes) ? parsed.passes.map(normalizePassRecord) : [],
    };
  } catch (error) {
    if (isFilesystemError(error)) {
      return createEmptyRegistry();
    }

    throw error;
  }
}

async function writeRegistry(state: RegistryState) {
  if (isReadOnlyFilesystem()) {
    return;
  }

  try {
    await ensureRegistryDir();
    await writeFile(REGISTRY_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    // Belt-and-braces: if we somehow land on a host the env check didn't
    // recognise but the FS still rejects the write, swallow it. Chain state
    // is the source of truth; the local file is just a dev-time cache.
    if (isFilesystemError(error)) {
      return;
    }

    throw error;
  }
}

async function withRegistryWrite<T>(update: (state: RegistryState) => T | Promise<T>) {
  let result: T;

  registryWriteQueue = registryWriteQueue.then(async () => {
    const state = await readRegistry();
    result = await update(state);
    await writeRegistry(state);
  });

  await registryWriteQueue;
  return result!;
}

function matchesAddress(left: string, right: string) {
  return normalizeAddress(left) === normalizeAddress(right);
}

function mergeByPassId(local: DataAccessPassObject[], chain: DataAccessPassObject[]) {
  const byId = new Map<string, DataAccessPassObject>();
  for (const pass of chain) {
    byId.set(pass.id, pass);
  }
  for (const pass of local) {
    const chainEntry = byId.get(pass.id);
    if (chainEntry) {
      // Chain is the source of truth for listed/owner/passesMinted/totalSupply.
      // Local overlay carries display niceties (gradient, assetFilename) and the
      // user's chosen seller display string, but doesn't override chain state.
      byId.set(pass.id, {
        ...pass,
        listed: chainEntry.listed,
        owner: chainEntry.owner,
        purchases: Math.max(pass.purchases, chainEntry.purchases),
        passesMinted: Math.max(pass.passesMinted ?? 1, chainEntry.passesMinted ?? 1),
        totalSupply: Math.max(pass.totalSupply ?? 1, chainEntry.totalSupply ?? 1),
        storageEndEpoch: Math.max(pass.storageEndEpoch ?? 0, chainEntry.storageEndEpoch ?? 0),
        storageTopUps: Math.max(pass.storageTopUps ?? 0, chainEntry.storageTopUps ?? 0),
        lastTransactionDigest: pass.lastTransactionDigest || chainEntry.lastTransactionDigest,
        lastStorageTopUpDigest: pass.lastStorageTopUpDigest || chainEntry.lastStorageTopUpDigest,
      });
    } else {
      byId.set(pass.id, pass);
    }
  }
  return Array.from(byId.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

async function mergedPasses(): Promise<DataAccessPassObject[]> {
  const [registry, chainPasses] = await Promise.all([readRegistry(), loadChainPasses()]);
  return mergeByPassId(registry.passes, chainPasses);
}

function gradientFor(index: number) {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

function registrySourceFor(storageSource: Extract<BlobPassRuntimeSource, "local" | "walrus">) {
  return storageSource === "walrus" ? "hybrid" : "local";
}

export async function listRegistryMarketplacePasses() {
  const passes = await mergedPasses();

  return passes
    .filter((pass) => pass.listed)
    .map(clonePass);
}

export async function listRegistryInventory(address: string) {
  const passes = await mergedPasses();

  return passes
    .filter((pass) => {
      const listedByUser = pass.listed && matchesAddress(pass.seller, address);
      const ownedByUser = matchesAddress(pass.owner, address);
      return listedByUser || ownedByUser;
    })
    .map(clonePass);
}

export async function getRegistryPass(passId: string) {
  const passes = await mergedPasses();
  const pass = passes.find((item) => item.id === passId);
  return pass ? clonePass(pass) : null;
}

export async function getRegistryPassByListingId(listingId: string) {
  const passes = await mergedPasses();
  const pass = passes.find((item) => item.listingId === listingId);
  return pass ? clonePass(pass) : null;
}

export async function findRegistryPassByBlobId(blobId: string) {
  const passes = await mergedPasses();
  const pass = passes.find((item) => item.content.fields.walrus_blob_id === blobId);
  return pass ? clonePass(pass) : null;
}

export async function findRegistryPassByFileHash(fileHash: string) {
  const normalizedHash = fileHash.trim().toLowerCase();

  if (!normalizedHash) {
    return null;
  }

  const passes = await mergedPasses();
  const pass = passes.find((item) => item.fileHash.toLowerCase() === normalizedHash);
  return pass ? clonePass(pass) : null;
}

export async function verifyRegistryOwnership(address: string, passId: string) {
  const pass = await getRegistryPass(passId);

  if (!pass) {
    return false;
  }

  return matchesAddress(pass.owner, address);
}

export async function createRegistryListing(input: CreateRegistryListingInput) {
  return withRegistryWrite((registry) => {
    const seller = input.sellerAddress || DEMO_SELLER_ADDRESS;
    const sequence = registry.sequence;
    const slug = slugify(input.title) || `asset-${sequence}`;
    const storageStartEpoch = input.storageStartEpoch ?? 0;
    const pass: DataAccessPassObject = {
      id: `0xpass_${slug}_${sequence}`,
      listingId: `registry-listing-${sequence}`,
      listingInitialSharedVersion: "",
      blobObjectId: input.blobObjectId || `registry-blob-${sequence}`,
      owner: seller,
      seller,
      category: input.category,
      priceMist: input.priceMist,
      createdAt: new Date().toISOString(),
      purchases: 0,
      gradient: gradientFor(sequence),
      listed: true,
      source: registrySourceFor(input.storageSource),
      storageSource: input.storageSource,
      verificationMode: "registry",
      assetFilename: input.assetFilename,
      fileHash: input.fileHash || input.fields.walrus_blob_id,
      originalUploader: input.originalUploader || seller,
      royaltyBps: input.royaltyBps ?? DEFAULT_ROYALTY_BPS,
      storageStartEpoch,
      storageEndEpoch: input.storageEndEpoch ?? defaultStorageEndEpoch(storageStartEpoch),
      storageEpochDurationDays: input.storageEpochDurationDays ?? getEpochDurationDays(),
      storageRegisteredAt: new Date().toISOString(),
      storageTopUps: 0,
      storageRoyaltyMist: "0",
      pointer: false,
      totalSupply: Math.max(1, input.totalSupply ?? 1),
      passesMinted: Math.max(1, input.passesMinted ?? 1),
      content: {
        fields: {
          ...input.fields,
        },
      },
    };

    registry.sequence += 1;
    registry.passes.unshift(pass);

    return clonePass(pass);
  });
}

type IndexRegistryListingInput = CreateRegistryListingInput & {
  passId: string;
  listingId: string;
  listingInitialSharedVersion?: string;
  transactionDigest?: string;
};

export async function indexRegistryListing(input: IndexRegistryListingInput) {
  return withRegistryWrite((registry) => {
    const existingIndex = registry.passes.findIndex(
      (item) => item.id === input.passId || item.listingId === input.listingId,
    );
    const existing = existingIndex >= 0 ? registry.passes[existingIndex] : null;
    const seller = input.sellerAddress || existing?.seller || DEMO_SELLER_ADDRESS;
    const storageStartEpoch = input.storageStartEpoch ?? existing?.storageStartEpoch ?? 0;
    const nextPass: DataAccessPassObject = normalizePassRecord({
      id: input.passId,
      listingId: input.listingId,
      listingInitialSharedVersion: input.listingInitialSharedVersion || existing?.listingInitialSharedVersion || "",
      blobObjectId: input.blobObjectId || existing?.blobObjectId || "",
      owner: existing?.owner || seller,
      seller,
      category: input.category,
      priceMist: input.priceMist,
      createdAt: existing?.createdAt || new Date().toISOString(),
      purchases: existing?.purchases ?? 0,
      gradient: existing?.gradient || gradientFor(registry.sequence),
      listed: true,
      source: registrySourceFor(input.storageSource),
      storageSource: input.storageSource,
      verificationMode: "tatum-object-owner",
      assetFilename: input.assetFilename,
      fileHash: input.fileHash || existing?.fileHash || input.fields.walrus_blob_id,
      originalUploader: input.originalUploader || existing?.originalUploader || seller,
      royaltyBps: input.royaltyBps ?? existing?.royaltyBps ?? DEFAULT_ROYALTY_BPS,
      storageStartEpoch,
      storageEndEpoch: input.storageEndEpoch ?? existing?.storageEndEpoch ?? defaultStorageEndEpoch(storageStartEpoch),
      storageEpochDurationDays: input.storageEpochDurationDays ?? existing?.storageEpochDurationDays ?? getEpochDurationDays(),
      storageRegisteredAt: existing?.storageRegisteredAt || new Date().toISOString(),
      storageTopUps: existing?.storageTopUps ?? 0,
      storageRoyaltyMist: existing?.storageRoyaltyMist || "0",
      pointer: existing?.pointer ?? false,
      duplicateOfPassId: existing?.duplicateOfPassId,
      lastTransactionDigest: input.transactionDigest || existing?.lastTransactionDigest,
      lastStorageTopUpDigest: existing?.lastStorageTopUpDigest,
      totalSupply: Math.max(1, input.totalSupply ?? existing?.totalSupply ?? 1),
      passesMinted: Math.max(1, input.passesMinted ?? existing?.passesMinted ?? 1),
      content: {
        fields: {
          ...input.fields,
        },
      },
    });

    if (existingIndex >= 0) {
      registry.passes.splice(existingIndex, 1);
    } else {
      registry.sequence += 1;
    }

    registry.passes.unshift(nextPass);
    return clonePass(nextPass);
  });
}

export async function purchaseRegistryPass(passId: string, buyerAddress: string) {
  return withRegistryWrite((registry) => {
    const pass = registry.passes.find((item) => item.id === passId);

    if (!pass || !pass.listed) {
      return null;
    }

    pass.listed = false;
    pass.owner = buyerAddress;
    pass.purchases += 1;

    return clonePass(pass);
  });
}

export async function syncRegistryPurchase({
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
  return withRegistryWrite((registry) => {
    const pass = registry.passes.find(
      (item) => item.listingId === listingId || (passId ? item.id === passId : false),
    );

    if (!pass) {
      return null;
    }

    if (passId) {
      pass.id = passId;
    }

    pass.listed = false;
    pass.owner = buyerAddress;
    pass.purchases += 1;
    pass.verificationMode = "tatum-object-owner";
    pass.lastTransactionDigest = transactionDigest || pass.lastTransactionDigest;

    return clonePass(pass);
  });
}

export async function syncRegistryDelist({
  listingId,
  sellerAddress,
  passId,
  transactionDigest,
}: {
  listingId: string;
  sellerAddress: string;
  passId?: string;
  transactionDigest?: string;
}) {
  return withRegistryWrite((registry) => {
    const pass = registry.passes.find(
      (item) => item.listingId === listingId || (passId ? item.id === passId : false),
    );

    if (!pass || !matchesAddress(pass.seller, sellerAddress)) {
      return null;
    }

    if (passId) {
      pass.id = passId;
    }

    pass.listed = false;
    pass.owner = sellerAddress;
    pass.verificationMode = "tatum-object-owner";
    pass.lastTransactionDigest = transactionDigest || pass.lastTransactionDigest;

    return clonePass(pass);
  });
}

export async function mintRegistryAccessPointer({
  fileHash,
  buyerAddress,
  royaltyMist,
  transactionDigest,
  passId,
}: {
  fileHash: string;
  buyerAddress: string;
  royaltyMist: string;
  transactionDigest?: string;
  passId?: string;
}) {
  return withRegistryWrite((registry) => {
    const original = registry.passes.find(
      (item) => item.fileHash.toLowerCase() === fileHash.trim().toLowerCase(),
    );

    if (!original) {
      return null;
    }

    const sequence = registry.sequence;
    const pointerPass: DataAccessPassObject = normalizePassRecord({
      ...original,
      id: passId || `0xpointer_${slugify(original.content.fields.title) || "asset"}_${sequence}`,
      listingId: `registry-pointer-${sequence}`,
      listingInitialSharedVersion: "",
      blobObjectId: original.blobObjectId,
      owner: buyerAddress,
      seller: original.seller,
      createdAt: new Date().toISOString(),
      purchases: 0,
      gradient: gradientFor(sequence),
      listed: false,
      source: "registry",
      verificationMode: "registry",
      pointer: true,
      duplicateOfPassId: original.id,
      storageRoyaltyMist: royaltyMist,
      lastTransactionDigest: transactionDigest,
    });

    original.purchases += 1;
    original.passesMinted = Math.min(original.totalSupply, (original.passesMinted || 1) + 1);
    original.storageRoyaltyMist = (
      BigInt(original.storageRoyaltyMist || "0") + BigInt(royaltyMist || "0")
    ).toString();
    registry.sequence += 1;
    registry.passes.unshift(pointerPass);

    return clonePass(pointerPass);
  });
}

export async function extendRegistryStorage({
  fileHash,
  additionalEpochs,
  transactionDigest,
}: {
  fileHash: string;
  additionalEpochs: number;
  transactionDigest?: string;
}) {
  return withRegistryWrite((registry) => {
    const normalizedHash = fileHash.trim().toLowerCase();
    const updated: DataAccessPassObject[] = [];

    for (const pass of registry.passes) {
      if (pass.fileHash.toLowerCase() !== normalizedHash) {
        continue;
      }

      pass.storageEndEpoch += additionalEpochs;
      pass.storageTopUps += 1;
      pass.lastStorageTopUpDigest = transactionDigest || pass.lastStorageTopUpDigest;
      updated.push(clonePass(pass));
    }

    return updated;
  });
}

export async function getRegistrySellerEarnings(address: string) {
  const passes = await mergedPasses();

  return passes.reduce((total, pass) => {
    if (!matchesAddress(pass.seller, address) || pass.purchases < 1) {
      return total;
    }

    return total + BigInt(pass.priceMist);
  }, BigInt(0));
}
