const MIST_PER_SUI = BigInt("1000000000");

export const DEMO_BUYER_ADDRESS =
  "0x00000000000000000000000000000000000000000000000000000000000b10b";

export const DEMO_SELLER_ADDRESS =
  "0x000000000000000000000000000000000000000000000000000000000005e11";

export function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

export function shortAddress(address: string) {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortBlob(blobId: string) {
  if (blobId.length <= 18) {
    return blobId;
  }

  return `${blobId.slice(0, 9)}...${blobId.slice(-5)}`;
}

export function formatBytes(bytes: string | number) {
  const value = typeof bytes === "string" ? Number.parseInt(bytes, 10) : bytes;

  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

export function mistToSui(mist: string | number | bigint) {
  const value = BigInt(mist);
  const whole = value / MIST_PER_SUI;
  const fraction = (value % MIST_PER_SUI)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function suiToMist(value: string) {
  const normalized = value.trim().replace(/,/g, "");

  if (!/^\d+(\.\d{0,9})?$/.test(normalized)) {
    return "0";
  }

  const [whole = "0", fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}000000000`.slice(0, 9);

  return (
    BigInt(whole || "0") * MIST_PER_SUI +
    BigInt(paddedFraction || "0")
  ).toString();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function sanitizeFilename(value: string) {
  const safe = slugify(value);
  return safe || "blobpass-download";
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
