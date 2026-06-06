import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
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
  fields: DataAccessPassFields;
};

const REGISTRY_DIR = path.join(process.cwd(), ".blobpass");
const REGISTRY_FILE = path.join(REGISTRY_DIR, "registry.json");
const DEFAULT_GRADIENTS = [
  "from-cyan-900 via-blue-900 to-zinc-950",
  "from-blue-950 via-slate-900 to-cyan-950",
  "from-slate-950 via-cyan-950 to-zinc-900",
  "from-indigo-950 via-zinc-900 to-cyan-950",
] as const;

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

function normalizePassRecord(pass: DataAccessPassObject): DataAccessPassObject {
  return {
    ...pass,
    owner: pass.owner || pass.seller || DEMO_SELLER_ADDRESS,
    seller: pass.seller || DEMO_SELLER_ADDRESS,
    sellerKioskId: pass.sellerKioskId || `registry-seller-${Date.now()}`,
    listingKioskId: pass.listingKioskId || `registry-listing-${Date.now()}`,
    category: pass.category || "Digital Asset",
    priceMist: pass.priceMist || "0",
    createdAt: pass.createdAt || new Date().toISOString(),
    purchases: Number.isFinite(pass.purchases) ? pass.purchases : 0,
    gradient: pass.gradient || DEFAULT_GRADIENTS[0],
    listed: Boolean(pass.listed),
    source: pass.source || "registry",
    storageSource: pass.storageSource || "local",
    verificationMode: pass.verificationMode || "registry",
    assetFilename: pass.assetFilename || `${sanitizeFilename(pass.content.fields.title)}.bin`,
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
  await ensureRegistryDir();

  try {
    const raw = await readFile(REGISTRY_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<RegistryState>;

    return {
      version: 1,
      sequence: Number.isFinite(parsed.sequence) ? Number(parsed.sequence) : 1,
      passes: Array.isArray(parsed.passes) ? parsed.passes.map(normalizePassRecord) : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createEmptyRegistry();
    }

    throw error;
  }
}

async function writeRegistry(state: RegistryState) {
  await ensureRegistryDir();
  await writeFile(REGISTRY_FILE, JSON.stringify(state, null, 2), "utf8");
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

function gradientFor(index: number) {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

function registrySourceFor(storageSource: Extract<BlobPassRuntimeSource, "local" | "walrus">) {
  return storageSource === "walrus" ? "hybrid" : "local";
}

export async function listRegistryMarketplacePasses() {
  const registry = await readRegistry();

  return registry.passes
    .filter((pass) => pass.listed)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(clonePass);
}

export async function listRegistryInventory(address: string) {
  const registry = await readRegistry();

  return registry.passes
    .filter((pass) => {
      const listedByUser = pass.listed && matchesAddress(pass.seller, address);
      const ownedByUser = matchesAddress(pass.owner, address);
      return listedByUser || ownedByUser;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(clonePass);
}

export async function getRegistryPass(passId: string) {
  const registry = await readRegistry();
  const pass = registry.passes.find((item) => item.id === passId);
  return pass ? clonePass(pass) : null;
}

export async function findRegistryPassByBlobId(blobId: string) {
  const registry = await readRegistry();
  const pass = registry.passes.find((item) => item.content.fields.walrus_blob_id === blobId);
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
    const pass: DataAccessPassObject = {
      id: `0xpass_${slug}_${sequence}`,
      owner: seller,
      seller,
      sellerKioskId: `registry-seller-${slugify(seller).slice(0, 18) || sequence}`,
      listingKioskId: `registry-listing-${sequence}`,
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

export async function purchaseRegistryPass(passId: string, buyerAddress: string) {
  return withRegistryWrite((registry) => {
    const pass = registry.passes.find((item) => item.id === passId);

    if (!pass || !pass.listed) {
      return null;
    }

    pass.listed = false;
    pass.owner = buyerAddress;
    pass.listingKioskId = `registry-owner-${slugify(buyerAddress).slice(0, 18) || "buyer"}`;
    pass.purchases += 1;

    return clonePass(pass);
  });
}

export async function getRegistrySellerEarnings(address: string) {
  const registry = await readRegistry();

  return registry.passes.reduce((total, pass) => {
    if (!matchesAddress(pass.seller, address) || pass.purchases < 1) {
      return total;
    }

    return total + BigInt(pass.priceMist);
  }, BigInt(0));
}
