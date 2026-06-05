import type {
  BlobVisibility,
  DataAccessPassFields,
  DataAccessPassObject,
} from "./types";
import {
  DEMO_BUYER_ADDRESS,
  DEMO_SELLER_ADDRESS,
  normalizeAddress,
  slugify,
} from "./format";

type DemoStoredBlob = {
  blobId: string;
  bytes: Uint8Array;
  contentType: string;
  filename: string;
  visibility: BlobVisibility;
};

type DemoStore = {
  passes: DataAccessPassObject[];
  ownership: Record<string, string[]>;
  blobs: Map<string, DemoStoredBlob>;
  sequence: number;
};

type CreateDemoListingInput = {
  sellerAddress?: string;
  title: string;
  description: string;
  category: string;
  priceMist: string;
  fields: DataAccessPassFields;
};

const seedPasses: DataAccessPassObject[] = [
  {
    id: "0xpass_terrain_v4",
    owner: "0xkiosk_creator_terrain",
    seller: "0x8b1e00000000000000000000000000000000f221",
    sellerKioskId: "0xkiosk_creator_terrain",
    listingKioskId: "0xkiosk_creator_terrain",
    category: "Datasets",
    priceMist: "45000000000",
    createdAt: "2026-05-24T10:00:00.000Z",
    purchases: 128,
    gradient: "from-slate-950 via-sky-950 to-amber-200",
    listed: true,
    content: {
      fields: {
        title: "Global Satellite Terrain Dataset v4",
        description: "High-resolution topology data for GIS applications.",
        file_size: "4519714816",
        file_type: "application/zip",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_terrain_v4",
      },
    },
  },
  {
    id: "0xpass_crm_source",
    owner: "0xkiosk_creator_crm",
    seller: "0x21a900000000000000000000000000000000a9e4",
    sellerKioskId: "0xkiosk_creator_crm",
    listingKioskId: "0xkiosk_creator_crm",
    category: "Source Code",
    priceMist: "120500000000",
    createdAt: "2026-05-22T11:30:00.000Z",
    purchases: 54,
    gradient: "from-blue-950 via-slate-800 to-cyan-500",
    listed: true,
    content: {
      fields: {
        title: "Enterprise CRM Source Code",
        description: "A complete Sui-native CRM starter with Move contracts.",
        file_size: "891289600",
        file_type: "application/zip",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_crm_source",
      },
    },
  },
  {
    id: "0xpass_ml_training",
    owner: DEMO_BUYER_ADDRESS,
    seller: "0x4ad300000000000000000000000000000000d3e1",
    sellerKioskId: "0xkiosk_creator_ml",
    listingKioskId: "0xkiosk_buyer_demo",
    category: "AI Models",
    priceMist: "12500000000",
    createdAt: "2026-05-21T09:00:00.000Z",
    purchases: 38,
    gradient: "from-zinc-100 via-zinc-300 to-zinc-950",
    listed: false,
    content: {
      fields: {
        title: "Machine Learning Training Set",
        description: "Cleaned CSV data for financial market prediction models.",
        file_size: "1932735283",
        file_type: "application/zip",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_ml_training",
      },
    },
  },
  {
    id: "0xpass_ui_kit",
    owner: DEMO_BUYER_ADDRESS,
    seller: "0x99e200000000000000000000000000000000e221",
    sellerKioskId: "0xkiosk_creator_ui",
    listingKioskId: "0xkiosk_buyer_demo",
    category: "Documents",
    priceMist: "8000000000",
    createdAt: "2026-05-19T13:15:00.000Z",
    purchases: 91,
    gradient: "from-fuchsia-200 via-indigo-400 to-zinc-950",
    listed: false,
    content: {
      fields: {
        title: "Cyberpunk UI Kit Pro",
        description: "High-fidelity Figma source files for modern dark dashboards.",
        file_size: "230686720",
        file_type: "application/zip",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_ui_kit",
      },
    },
  },
  {
    id: "0xpass_drone_footage",
    owner: "0xkiosk_creator_drone",
    seller: "0x11c200000000000000000000000000000000c221",
    sellerKioskId: "0xkiosk_creator_drone",
    listingKioskId: "0xkiosk_creator_drone",
    category: "Video",
    priceMist: "25000000000",
    createdAt: "2026-05-18T18:15:00.000Z",
    purchases: 75,
    gradient: "from-slate-200 via-blue-200 to-slate-950",
    listed: true,
    content: {
      fields: {
        title: "4K Drone Stock Footage Pack",
        description: "Royalty-free cinematic shots for launch films.",
        file_size: "10200547328",
        file_type: "video/mp4",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_drone_footage",
      },
    },
  },
  {
    id: "0xpass_wallet_extension",
    owner: "0xkiosk_creator_wallet",
    seller: "0xddff00000000000000000000000000000000ff10",
    sellerKioskId: "0xkiosk_creator_wallet",
    listingKioskId: "0xkiosk_creator_wallet",
    category: "Source Code",
    priceMist: "15000000000",
    createdAt: "2026-05-17T15:45:00.000Z",
    purchases: 63,
    gradient: "from-cyan-900 via-violet-600 to-slate-950",
    listed: true,
    content: {
      fields: {
        title: "Sui Wallet Extension v2.1",
        description: "React-based browser extension source for Sui wallets.",
        file_size: "429916160",
        file_type: "application/zip",
        preview_image_url: "",
        walrus_blob_id: "demo_hidden_wallet_extension",
      },
    },
  },
];

declare global {
  var __blobpassDemoStore: DemoStore | undefined;
}

function clonePass(pass: DataAccessPassObject): DataAccessPassObject {
  return {
    ...pass,
    content: {
      fields: { ...pass.content.fields },
    },
  };
}

function createStore(): DemoStore {
  return {
    passes: seedPasses.map(clonePass),
    ownership: {
      [normalizeAddress(DEMO_BUYER_ADDRESS)]: ["0xpass_ml_training", "0xpass_ui_kit"],
      [normalizeAddress(DEMO_SELLER_ADDRESS)]: [],
    },
    blobs: new Map(),
    sequence: 1,
  };
}

export function getDemoStore() {
  globalThis.__blobpassDemoStore ??= createStore();
  return globalThis.__blobpassDemoStore;
}

export function listDemoMarketplacePasses() {
  return getDemoStore()
    .passes.filter((pass) => pass.listed)
    .map(clonePass);
}

export function listDemoInventory(address: string) {
  const normalized = normalizeAddress(address);
  const store = getDemoStore();
  const ownedIds = new Set(store.ownership[normalized] ?? []);

  return store.passes
    .filter((pass) => {
      const ownsPass = ownedIds.has(pass.id) || normalizeAddress(pass.owner) === normalized;
      const listedByUser = pass.listed && normalizeAddress(pass.seller) === normalized;
      return ownsPass || listedByUser;
    })
    .map(clonePass);
}

export function getDemoPass(passId: string) {
  const pass = getDemoStore().passes.find((item) => item.id === passId);
  return pass ? clonePass(pass) : null;
}

export function findDemoPassByBlobId(blobId: string) {
  const pass = getDemoStore().passes.find(
    (item) => item.content.fields.walrus_blob_id === blobId,
  );

  return pass ? clonePass(pass) : null;
}

export function verifyDemoOwnership(address: string, passId: string) {
  const normalized = normalizeAddress(address);
  const pass = getDemoStore().passes.find((item) => item.id === passId);

  if (!pass) {
    return false;
  }

  return (
    normalizeAddress(pass.owner) === normalized ||
    (getDemoStore().ownership[normalized] ?? []).includes(passId)
  );
}

export function purchaseDemoPass(passId: string, buyerAddress: string) {
  const store = getDemoStore();
  const pass = store.passes.find((item) => item.id === passId);

  if (!pass) {
    return null;
  }

  pass.listed = false;
  pass.owner = buyerAddress;
  pass.listingKioskId = `0xkiosk_${slugify(buyerAddress).slice(0, 18) || "buyer"}`;
  pass.purchases += 1;

  const normalizedBuyer = normalizeAddress(buyerAddress);
  store.ownership[normalizedBuyer] ??= [];

  if (!store.ownership[normalizedBuyer].includes(pass.id)) {
    store.ownership[normalizedBuyer].push(pass.id);
  }

  return clonePass(pass);
}

export function addDemoListing(input: CreateDemoListingInput) {
  const store = getDemoStore();
  const slug = slugify(input.title) || `asset-${store.sequence}`;
  const seller = input.sellerAddress || DEMO_SELLER_ADDRESS;
  const pass: DataAccessPassObject = {
    id: `0xpass_${slug}_${store.sequence}`,
    owner: `0xkiosk_creator_${store.sequence}`,
    seller,
    sellerKioskId: `0xkiosk_creator_${store.sequence}`,
    listingKioskId: `0xkiosk_creator_${store.sequence}`,
    category: input.category,
    priceMist: input.priceMist,
    createdAt: new Date().toISOString(),
    purchases: 0,
    gradient: "from-cyan-900 via-blue-900 to-zinc-950",
    listed: true,
    content: {
      fields: input.fields,
    },
  };

  store.sequence += 1;
  store.passes.unshift(pass);
  return clonePass(pass);
}

export function setDemoBlob(blob: DemoStoredBlob) {
  getDemoStore().blobs.set(blob.blobId, blob);
}

export function getDemoBlob(blobId: string) {
  return getDemoStore().blobs.get(blobId) ?? null;
}
