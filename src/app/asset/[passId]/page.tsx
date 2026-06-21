import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/chrome";
import { AssetDetailActions } from "@/components/asset/AssetDetailActions";
import { AssetPreview } from "@/components/asset/AssetPreview";
import { getDataAccessPass } from "@/lib/blobpass/ledger";
import {
  dateLabel,
  formatBytes,
  mistToSui,
  shortAddress,
  shortBlob,
} from "@/lib/blobpass/format";
import { isVerifiedCreator } from "@/lib/blobpass/verified";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function storageDaysRemaining(pass: {
  storageEndEpoch: number;
  storageStartEpoch: number;
  storageEpochDurationDays: number;
  storageRegisteredAt: string;
  createdAt: string;
}) {
  if (!pass.storageEndEpoch || !pass.storageEpochDurationDays) return 0;
  const totalEpochs = Math.max(0, pass.storageEndEpoch - (pass.storageStartEpoch || 0));
  const registeredAt = new Date(pass.storageRegisteredAt || pass.createdAt).getTime();
  const expiresAt = registeredAt + totalEpochs * pass.storageEpochDurationDays * MS_PER_DAY;
  if (!Number.isFinite(expiresAt)) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / MS_PER_DAY));
}

function suiVisionUrl(digest: string) {
  return `https://suivision.xyz/txblock/${digest}`;
}

function suiVisionObjectUrl(objectId: string) {
  return `https://suivision.xyz/object/${objectId}`;
}

function suiVisionAddressUrl(address: string) {
  return `https://suivision.xyz/account/${address}`;
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 first:pl-0 last:pr-0">
      <div className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
        {label}
      </div>
      <div className="mono mt-1 truncate text-[14px] tabular-nums">{value}</div>
    </div>
  );
}

function KeyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mono flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink-08)] pb-2 text-[12px] last:border-b-0 last:pb-0">
      <span className="text-[10px] tracking-[0.2em] text-[var(--ink-40)]">
        {label}
      </span>
      <span className="break-all text-right tabular-nums">{children}</span>
    </div>
  );
}

function AddressRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border border-[var(--ink-16)] p-3">
      <div className="mono mb-1 text-[10px] tracking-[0.2em] text-[var(--ink-40)]">
        {label}
      </div>
      <a
        className="mono break-all text-[13px] hover:underline"
        href={suiVisionAddressUrl(value)}
        rel="noreferrer"
        target="_blank"
      >
        {shortAddress(value)} ↗
      </a>
      <div className="mono mt-1 text-[10px] tracking-[0.12em] text-[var(--ink-40)]">
        {hint}
      </div>
    </div>
  );
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ passId: string }>;
}) {
  const { passId } = await params;
  const pass = await getDataAccessPass(passId);

  if (!pass) {
    notFound();
  }

  const fields = pass.content.fields;
  const editionTotal = Math.max(1, pass.totalSupply ?? 1);
  const editionsMinted = Math.min(editionTotal, Math.max(1, pass.passesMinted ?? 1));
  const editionsRemaining = Math.max(0, editionTotal - editionsMinted);
  const soldOut = editionsRemaining <= 0;
  const daysRemaining = storageDaysRemaining(pass);
  const storageState =
    daysRemaining <= 0 ? "EXPIRED" : daysRemaining <= 3 ? "EXPIRING" : "ACTIVE";
  const storageColor =
    daysRemaining <= 0
      ? "#c0392b"
      : daysRemaining <= 3
        ? "#d4a853"
        : "var(--signal-deep)";
  const verified =
    isVerifiedCreator(pass.originalUploader) || isVerifiedCreator(pass.seller);
  const priceSui = mistToSui(pass.priceMist);
  const royaltyPct = (pass.royaltyBps / 100).toFixed(pass.royaltyBps % 100 === 0 ? 0 : 2);

  return (
    <>
      <Header />
      <main className="shell py-12 md:py-16">
        <nav className="mono mb-8 flex items-center gap-2 text-[11px] tracking-[0.18em] text-[var(--ink-40)]">
          <Link className="hover:text-[var(--ink)]" href="/marketplace">
            MARKETPLACE
          </Link>
          <span>/</span>
          <span className="text-[var(--ink)]">{pass.category.toUpperCase()}</span>
          <span>/</span>
          <span className="truncate text-[var(--ink-60)]">{shortBlob(pass.id)}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
          <div className="surface overflow-hidden bg-[var(--paper)]">
            <AssetPreview
              category={pass.category}
              previewImageUrl={fields.preview_image_url}
            />
          </div>

          <div className="flex flex-col gap-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag">[ {pass.category.toUpperCase()} ]</span>
                <span className="tag tag-signal">[ WALRUS ]</span>
                {verified ? (
                  <span className="tag tag-signal">[ ✓ VERIFIED ]</span>
                ) : null}
                <span
                  className="tag"
                  style={{
                    background: soldOut ? "transparent" : "var(--ink)",
                    color: soldOut ? "#c0392b" : "var(--paper)",
                    borderColor: soldOut ? "#c0392b" : "var(--ink)",
                  }}
                >
                  {soldOut
                    ? "[ SOLD OUT ]"
                    : `[ ED ${editionsMinted}/${editionTotal} ]`}
                </span>
                {pass.listed ? (
                  <span className="tag">[ LISTED ]</span>
                ) : (
                  <span className="tag" style={{ borderColor: "var(--ink-40)", color: "var(--ink-40)" }}>
                    [ UNLISTED ]
                  </span>
                )}
              </div>
              <h1 className="display break-words text-[clamp(32px,5vw,56px)] leading-[1.05]">
                {fields.title}
              </h1>
              <p className="mono max-w-[64ch] break-words text-[14px] leading-[1.9] text-[var(--ink-60)]">
                {fields.description}
              </p>
            </header>

            <div className="grid grid-cols-2 divide-x divide-[var(--ink-16)] border-y border-[var(--ink-16)] py-5 sm:grid-cols-4">
              <DetailStat label="PRICE" value={`${priceSui} SUI`} />
              <DetailStat label="FILE SIZE" value={formatBytes(fields.file_size)} />
              <DetailStat label="FILE TYPE" value={fields.file_type.toUpperCase()} />
              <DetailStat label="ROYALTY" value={`${royaltyPct}%`} />
            </div>

            <AssetDetailActions
              listed={pass.listed}
              listingId={pass.listingId}
              listingInitialSharedVersion={pass.listingInitialSharedVersion}
              passId={pass.id}
              priceMist={pass.priceMist}
              soldOut={soldOut}
            />

            <section className="surface bg-[var(--paper)] p-6">
              <h2 className="mono mb-5 text-[11px] tracking-[0.2em] text-[var(--ink-40)]">
                CREATOR
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <AddressRow
                  hint="Original uploader"
                  label="UPLOADER"
                  value={pass.originalUploader}
                />
                <AddressRow
                  hint="Current seller of record"
                  label="SELLER"
                  value={pass.seller}
                />
                <AddressRow
                  hint="Current on-chain owner"
                  label="HOLDER"
                  value={pass.owner}
                />
              </div>
            </section>

            <section className="surface bg-[var(--paper)] p-6">
              <h2 className="mono mb-5 text-[11px] tracking-[0.2em] text-[var(--ink-40)]">
                STORAGE
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyRow label="STATE">
                  <span style={{ color: storageColor }}>[ {storageState} ]</span>
                </KeyRow>
                <KeyRow label="REMAINING">
                  {daysRemaining > 0 ? `${daysRemaining}d` : "0d"}
                </KeyRow>
                <KeyRow label="START EPOCH">{pass.storageStartEpoch}</KeyRow>
                <KeyRow label="END EPOCH">{pass.storageEndEpoch}</KeyRow>
                <KeyRow label="EPOCH LENGTH">
                  {pass.storageEpochDurationDays}d
                </KeyRow>
                <KeyRow label="TOP-UPS">{pass.storageTopUps}</KeyRow>
              </div>
            </section>

            <section className="surface bg-[var(--paper)] p-6">
              <h2 className="mono mb-5 text-[11px] tracking-[0.2em] text-[var(--ink-40)]">
                ON-CHAIN
              </h2>
              <div className="grid gap-3">
                <KeyRow label="PASS ID">
                  <a
                    className="hover:underline"
                    href={suiVisionObjectUrl(pass.id)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {shortBlob(pass.id)} ↗
                  </a>
                </KeyRow>
                {pass.listingId ? (
                  <KeyRow label="LISTING ID">
                    <a
                      className="hover:underline"
                      href={suiVisionObjectUrl(pass.listingId)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {shortBlob(pass.listingId)} ↗
                    </a>
                  </KeyRow>
                ) : null}
                {pass.blobObjectId ? (
                  <KeyRow label="BLOB OBJECT">
                    <a
                      className="hover:underline"
                      href={suiVisionObjectUrl(pass.blobObjectId)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {shortBlob(pass.blobObjectId)} ↗
                    </a>
                  </KeyRow>
                ) : null}
                <KeyRow label="WALRUS BLOB">{shortBlob(fields.walrus_blob_id)}</KeyRow>
                <KeyRow label="FILE HASH">{shortBlob(pass.fileHash)}</KeyRow>
                {pass.lastTransactionDigest ? (
                  <KeyRow label="LAST TX">
                    <a
                      className="hover:underline"
                      href={suiVisionUrl(pass.lastTransactionDigest)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {shortBlob(pass.lastTransactionDigest)} ↗
                    </a>
                  </KeyRow>
                ) : null}
                <KeyRow label="REGISTERED">{dateLabel(pass.createdAt)}</KeyRow>
                <KeyRow label="PURCHASES">{pass.purchases}</KeyRow>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
