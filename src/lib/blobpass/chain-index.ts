import { DEMO_SELLER_ADDRESS, sanitizeFilename } from "./format";
import type { DataAccessPassObject } from "./types";

const PAGE_LIMIT = 50;
const PAGE_SIZE = 50;
const DEFAULT_TTL_MS = 30_000;

const DEFAULT_GRADIENTS = [
  "from-cyan-900 via-blue-900 to-zinc-950",
  "from-blue-950 via-slate-900 to-cyan-950",
  "from-slate-950 via-cyan-950 to-zinc-900",
  "from-indigo-950 via-zinc-900 to-cyan-950",
] as const;

function gradientFor(index: number) {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

function getPackageId() {
  return process.env.NEXT_PUBLIC_BLOBPASS_PACKAGE_ID || "";
}

function getRpcUrl() {
  return (
    process.env.TATUM_SUI_RPC_URL ||
    process.env.NEXT_PUBLIC_TATUM_SUI_RPC ||
    process.env.NEXT_PUBLIC_TATUM_SUI_TESTNET_URL ||
    "https://sui-testnet.gateway.tatum.io"
  );
}

function getCacheTtl() {
  const raw = Number.parseInt(process.env.BLOBPASS_CHAIN_INDEX_TTL_MS || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MS;
}

function getEpochDurationDays() {
  const configured = Number.parseInt(
    process.env.WALRUS_EPOCH_DURATION_DAYS ??
      process.env.NEXT_PUBLIC_WALRUS_EPOCH_DURATION_DAYS ??
      "",
    10,
  );
  return Number.isFinite(configured) && configured > 0 ? configured : 14;
}

type SuiEvent = {
  id?: { txDigest?: string; eventSeq?: string };
  packageId?: string;
  transactionModule?: string;
  type?: string;
  parsedJson?: unknown;
  timestampMs?: string;
  sender?: string;
};

type QueryEventsResponse = {
  result?: {
    data?: SuiEvent[];
    nextCursor?: { txDigest?: string; eventSeq?: string } | null;
    hasNextPage?: boolean;
  };
  error?: { message?: string };
};

type CacheEntry = {
  fetchedAt: number;
  passes: DataAccessPassObject[];
};

let cache: CacheEntry | null = null;
let inflight: Promise<DataAccessPassObject[]> | null = null;

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toBigIntString(value: unknown, fallback = "0") {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function hexFromBytes(value: unknown): string {
  if (typeof value === "string") {
    return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
  }
  if (Array.isArray(value)) {
    return value
      .map((byte) => Number(byte).toString(16).padStart(2, "0"))
      .join("");
  }
  return "";
}

function isoFromTimestampMs(ms: unknown, fallbackIso: string) {
  const millis = typeof ms === "string" ? Number.parseInt(ms, 10) : typeof ms === "number" ? ms : NaN;
  if (Number.isFinite(millis) && millis > 0) {
    return new Date(millis).toISOString();
  }
  return fallbackIso;
}

async function queryEventsPage(cursor: { txDigest?: string; eventSeq?: string } | null) {
  const packageId = getPackageId();
  if (!packageId) {
    return { events: [] as SuiEvent[], nextCursor: null, hasNextPage: false };
  }

  const rpcUrl = getRpcUrl();
  // Fail fast if the RPC is unreachable (e.g. DNS EAI_AGAIN, offline)
  // so we don't block the landing render for 14+ seconds on first load.
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.TATUM_API_KEY ? { "x-api-key": process.env.TATUM_API_KEY } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "blobpass-chain-index",
      method: "suix_queryEvents",
      params: [
        { MoveEventModule: { package: packageId, module: "access_pass" } },
        cursor,
        PAGE_SIZE,
        false,
      ],
    }),
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    throw new Error(`Sui RPC queryEvents failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as QueryEventsResponse;
  if (payload.error) {
    throw new Error(payload.error.message || "Sui RPC queryEvents returned an error");
  }

  const data = payload.result?.data ?? [];
  return {
    events: data,
    nextCursor: payload.result?.nextCursor ?? null,
    hasNextPage: Boolean(payload.result?.hasNextPage),
  };
}

function makeBasePass(passId: string, sequence: number, createdAtIso: string): DataAccessPassObject {
  return {
    id: passId,
    listingId: "",
    listingInitialSharedVersion: "",
    blobObjectId: "",
    owner: DEMO_SELLER_ADDRESS,
    seller: DEMO_SELLER_ADDRESS,
    category: "Digital Asset",
    priceMist: "0",
    createdAt: createdAtIso,
    purchases: 0,
    gradient: gradientFor(sequence),
    listed: false,
    source: "tatum",
    storageSource: "walrus",
    verificationMode: "tatum-object-owner",
    assetFilename: "",
    fileHash: "",
    originalUploader: DEMO_SELLER_ADDRESS,
    royaltyBps: 500,
    storageStartEpoch: 0,
    storageEndEpoch: 0,
    storageEpochDurationDays: getEpochDurationDays(),
    storageRegisteredAt: createdAtIso,
    storageTopUps: 0,
    storageRoyaltyMist: "0",
    pointer: false,
    totalSupply: 1,
    passesMinted: 1,
    content: {
      fields: {
        title: "",
        description: "",
        file_size: "0",
        file_type: "application/octet-stream",
        preview_image_url: "",
        walrus_blob_id: "",
      },
    },
  };
}

function foldEvent(
  passes: Map<string, DataAccessPassObject>,
  byFileHash: Map<string, string>,
  byListingId: Map<string, string>,
  event: SuiEvent,
  sequence: number,
) {
  const parsed = (event.parsedJson ?? {}) as Record<string, unknown>;
  const type = event.type ?? "";
  const createdAtIso = isoFromTimestampMs(event.timestampMs, new Date(0).toISOString());

  if (type.endsWith("::access_pass::ListingCreated")) {
    const passId = typeof parsed.pass_id === "string" ? parsed.pass_id : "";
    const listingId = typeof parsed.listing_id === "string" ? parsed.listing_id : "";
    if (!passId || !listingId) return;

    const seller = typeof parsed.seller === "string" ? parsed.seller : DEMO_SELLER_ADDRESS;
    const base = passes.get(passId) ?? makeBasePass(passId, sequence, createdAtIso);
    base.listingId = listingId;
    base.seller = seller;
    base.owner = seller;
    base.originalUploader = seller;
    base.priceMist = toBigIntString(parsed.price, "0");
    base.listed = true;
    base.createdAt = createdAtIso;
    base.assetFilename = base.assetFilename || `${sanitizeFilename(String(parsed.title ?? "")) || "asset"}.bin`;
    base.content.fields.title = String(parsed.title ?? base.content.fields.title);
    base.content.fields.description = String(parsed.description ?? base.content.fields.description);
    base.content.fields.file_size = String(parsed.file_size ?? base.content.fields.file_size);
    base.content.fields.file_type = String(parsed.file_type ?? base.content.fields.file_type);
    base.content.fields.preview_image_url = String(parsed.preview_image_url ?? base.content.fields.preview_image_url);
    passes.set(passId, base);
    byListingId.set(listingId, passId);
    return;
  }

  if (type.endsWith("::access_pass::BlobRegistered")) {
    const passId = typeof parsed.pass_id === "string" ? parsed.pass_id : "";
    if (!passId) return;
    const base = passes.get(passId) ?? makeBasePass(passId, sequence, createdAtIso);
    const fileHash = hexFromBytes(parsed.file_hash);
    base.fileHash = fileHash || base.fileHash;
    base.content.fields.walrus_blob_id = String(parsed.walrus_blob_id ?? base.content.fields.walrus_blob_id);
    base.blobObjectId = typeof parsed.blob_object_id === "string" ? parsed.blob_object_id : base.blobObjectId;
    base.storageStartEpoch = toNumber(parsed.storage_start_epoch, base.storageStartEpoch);
    base.storageEndEpoch = toNumber(parsed.storage_end_epoch, base.storageEndEpoch);
    base.royaltyBps = toNumber(parsed.royalty_bps, base.royaltyBps);
    base.totalSupply = Math.max(1, toNumber(parsed.total_supply, base.totalSupply));
    base.passesMinted = Math.max(1, toNumber(parsed.passes_minted, base.passesMinted));
    if (typeof parsed.uploader === "string") base.originalUploader = parsed.uploader;
    passes.set(passId, base);
    if (fileHash) byFileHash.set(fileHash, passId);
    return;
  }

  if (type.endsWith("::access_pass::ListingPurchased")) {
    const passId = typeof parsed.pass_id === "string" ? parsed.pass_id : "";
    if (!passId) return;
    const existing = passes.get(passId);
    if (!existing) return;
    existing.listed = false;
    existing.owner = typeof parsed.buyer === "string" ? parsed.buyer : existing.owner;
    existing.purchases += 1;
    existing.lastTransactionDigest = event.id?.txDigest || existing.lastTransactionDigest;
    return;
  }

  if (type.endsWith("::access_pass::ListingDelisted")) {
    const passId = typeof parsed.pass_id === "string" ? parsed.pass_id : "";
    if (!passId) return;
    const existing = passes.get(passId);
    if (!existing) return;
    existing.listed = false;
    existing.owner = typeof parsed.seller === "string" ? parsed.seller : existing.owner;
    existing.lastTransactionDigest = event.id?.txDigest || existing.lastTransactionDigest;
    return;
  }

  if (type.endsWith("::access_pass::AccessPointerMinted")) {
    const pointerPassId = typeof parsed.pass_id === "string" ? parsed.pass_id : "";
    const originalPassId = typeof parsed.original_pass_id === "string" ? parsed.original_pass_id : "";
    if (!pointerPassId) return;

    const original = originalPassId ? passes.get(originalPassId) : undefined;
    const fallbackHash = hexFromBytes(parsed.file_hash);
    const originalViaHash = !original && fallbackHash ? passes.get(byFileHash.get(fallbackHash) ?? "") : undefined;
    const source = original ?? originalViaHash;

    if (source) {
      source.purchases += 1;
      source.passesMinted = Math.min(source.totalSupply, source.passesMinted + 1);
      source.storageRoyaltyMist = (
        BigInt(source.storageRoyaltyMist || "0") + BigInt(toBigIntString(parsed.royalty_paid_mist, "0"))
      ).toString();
    }

    const pointer = makeBasePass(pointerPassId, sequence, createdAtIso);
    if (source) {
      pointer.listingId = `chain-pointer-${pointerPassId.slice(0, 12)}`;
      pointer.seller = source.seller;
      pointer.owner = typeof parsed.buyer === "string" ? parsed.buyer : source.owner;
      pointer.originalUploader = source.originalUploader;
      pointer.category = source.category;
      pointer.priceMist = source.priceMist;
      pointer.fileHash = source.fileHash;
      pointer.storageStartEpoch = source.storageStartEpoch;
      pointer.storageEndEpoch = toNumber(parsed.storage_end_epoch, source.storageEndEpoch);
      pointer.royaltyBps = source.royaltyBps;
      pointer.content.fields = { ...source.content.fields };
      pointer.duplicateOfPassId = source.id;
      pointer.totalSupply = source.totalSupply;
      pointer.passesMinted = source.passesMinted;
    } else {
      pointer.owner = typeof parsed.buyer === "string" ? parsed.buyer : pointer.owner;
      pointer.fileHash = fallbackHash;
      pointer.content.fields.walrus_blob_id = String(parsed.walrus_blob_id ?? "");
    }
    pointer.pointer = true;
    pointer.listed = false;
    pointer.storageRoyaltyMist = toBigIntString(parsed.royalty_paid_mist, "0");
    pointer.lastTransactionDigest = event.id?.txDigest || pointer.lastTransactionDigest;
    passes.set(pointerPassId, pointer);
    return;
  }

  if (type.endsWith("::access_pass::StorageExtended")) {
    const fileHash = hexFromBytes(parsed.file_hash);
    if (!fileHash) return;
    const additional = toNumber(parsed.additional_epochs, 0);
    for (const pass of passes.values()) {
      if (pass.fileHash === fileHash) {
        pass.storageEndEpoch = toNumber(parsed.storage_end_epoch, pass.storageEndEpoch + additional);
        pass.storageTopUps += 1;
        pass.lastStorageTopUpDigest = event.id?.txDigest || pass.lastStorageTopUpDigest;
      }
    }
    return;
  }
}

async function fetchAllPasses(): Promise<DataAccessPassObject[]> {
  if (!getPackageId()) {
    return [];
  }

  const passes = new Map<string, DataAccessPassObject>();
  const byFileHash = new Map<string, string>();
  const byListingId = new Map<string, string>();

  let cursor: { txDigest?: string; eventSeq?: string } | null = null;
  let sequence = 0;

  for (let page = 0; page < PAGE_LIMIT; page += 1) {
    const { events, nextCursor, hasNextPage } = await queryEventsPage(cursor);
    for (const event of events) {
      foldEvent(passes, byFileHash, byListingId, event, sequence);
      sequence += 1;
    }
    if (!hasNextPage || !nextCursor) break;
    cursor = nextCursor;
  }

  return Array.from(passes.values())
    .filter((pass) => pass.id && pass.content.fields.walrus_blob_id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function loadChainPasses(): Promise<DataAccessPassObject[]> {
  if (!getPackageId()) {
    return [];
  }

  const ttl = getCacheTtl();
  const now = Date.now();
  if (cache && now - cache.fetchedAt < ttl) {
    return cache.passes.map(clonePass);
  }

  if (inflight) {
    return (await inflight).map(clonePass);
  }

  inflight = fetchAllPasses()
    .then((passes) => {
      cache = { fetchedAt: Date.now(), passes };
      return passes;
    })
    .catch((error) => {
      console.warn("[blobpass] chain-index fetch failed:", error);
      return cache?.passes ?? [];
    })
    .finally(() => {
      inflight = null;
    });

  const passes = await inflight;
  return passes.map(clonePass);
}

function clonePass(pass: DataAccessPassObject): DataAccessPassObject {
  return {
    ...pass,
    content: { fields: { ...pass.content.fields } },
  };
}

export function __resetChainIndexCacheForTests() {
  cache = null;
  inflight = null;
}
