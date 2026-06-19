import { normalizeAddress } from "./format";

// BlobPass-team verified creators. Listings whose seller wallet matches one of
// these addresses get the in-app "verified" badge. This is an application-level
// social signal — it is not an on-chain or Sui-wide verification. To add a
// creator, drop their lowercase address into the set below, or set
// BLOBPASS_VERIFIED_CREATORS (comma-separated) in the environment.
const SEEDED_VERIFIED_CREATORS: ReadonlyArray<string> = [
  "0x159de61c689897932f0d732cbfccfd1b4215b723174de5832309eec6f954df12",
];

function getEnvVerifiedCreators(): string[] {
  const raw = process.env.BLOBPASS_VERIFIED_CREATORS || "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

let cached: Set<string> | null = null;

function getVerifiedSet(): Set<string> {
  if (cached) {
    return cached;
  }

  const set = new Set<string>();
  for (const address of SEEDED_VERIFIED_CREATORS) {
    set.add(normalizeAddress(address));
  }
  for (const address of getEnvVerifiedCreators()) {
    set.add(normalizeAddress(address));
  }

  cached = set;
  return set;
}

export function isVerifiedCreator(address: string | undefined | null): boolean {
  if (!address) {
    return false;
  }
  return getVerifiedSet().has(normalizeAddress(address));
}
