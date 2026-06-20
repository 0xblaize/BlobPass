"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildBuyListingTransaction,
  buildDelistListingTransaction,
  buildStorageTopUpTransaction,
  getListingDelistedEvent,
  getListingPurchasedEvent,
  getTransferredPassChange,
} from "@/lib/blobpass/sui";
import type { LibraryAssetView, MarketplaceListing } from "@/lib/blobpass/types";

const STORAGE_TOP_UP_MIST_PER_EPOCH = BigInt("100000000");

function hexToBytes(value: string) {
  const normalized = value.trim().replace(/^0x/i, "");
  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 2) {
    bytes.push(Number.parseInt(normalized.slice(index, index + 2), 16));
  }
  return bytes;
}

function VerifiedBadge({ label = "VERIFIED" }: { label?: string }) {
  return (
    <span
      className="tag tag-signal"
      title="BlobPass Team verified creator"
    >
      [ ✓ {label} ]
    </span>
  );
}

function PreviewImage({
  item,
  heightClass,
}: {
  item: Pick<MarketplaceListing | LibraryAssetView, "previewImageUrl" | "gradient" | "category">;
  heightClass: string;
}) {
  return (
    <div className={`asset-image relative overflow-hidden ${heightClass}`}>
      {item.previewImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          src={item.previewImageUrl}
        />
      ) : null}
      <span className="absolute right-2 top-2 z-[2] mono text-[10px] tracking-[0.16em] border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
        WALRUS
      </span>
      <span className="absolute bottom-2 left-2 z-[2] mono text-[10px] tracking-[0.16em] border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
        {item.category.toUpperCase()}
      </span>
    </div>
  );
}

function usePurchase(item: MarketplaceListing) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [state, setState] = useState<"idle" | "buying" | "owned" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function buy() {
    if (!account?.address) {
      setState("error");
      setErrorMessage("Connect a Sui wallet before purchasing access.");
      return;
    }
    setState("buying");
    setErrorMessage("");
    try {
      const transaction = buildBuyListingTransaction({
        listingId: item.listingId,
        priceMist: item.priceMist,
        listingInitialSharedVersion: item.listingInitialSharedVersion,
      });
      const txResult = await signAndExecute.mutateAsync({ transaction });
      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: { showEvents: true, showObjectChanges: true },
      });
      const purchasedEvent = getListingPurchasedEvent(finalized);
      const transferredPass = getTransferredPassChange(finalized);
      const passId =
        purchasedEvent?.pass_id ||
        (typeof transferredPass?.objectId === "string" ? transferredPass.objectId : undefined);
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: item.listingId,
          passId,
          buyerAddress: account.address,
          transactionDigest: txResult.digest,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Purchase request failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setState("owned");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Purchase handshake failed.");
    }
  }

  return { buy, state, account, errorMessage };
}

function useStorageTopUp(asset: LibraryAssetView) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [state, setState] = useState<"idle" | "signing" | "confirming" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function topUp(additionalEpochs = 1) {
    if (!account?.address) {
      setState("error");
      setErrorMessage("Connect a Sui wallet before extending storage.");
      return;
    }
    setState("signing");
    setErrorMessage("");
    try {
      const transaction = buildStorageTopUpTransaction({
        fileHashBytes: hexToBytes(asset.fileHash),
        additionalEpochs,
        topUpMist: (STORAGE_TOP_UP_MIST_PER_EPOCH * BigInt(additionalEpochs)).toString(),
        blobObjectId: asset.blobObjectId,
      });
      const txResult = await signAndExecute.mutateAsync({ transaction });
      setState("confirming");
      await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: { showEvents: true, showObjectChanges: true },
      });
      const response = await fetch("/api/storage-top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileHash: asset.fileHash,
          additionalEpochs,
          walletAddress: account.address,
          transactionDigest: txResult.digest,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Storage top-up sync failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      setState("idle");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Storage top-up failed.");
    }
  }

  return { topUp, state, errorMessage };
}

function useDelist(asset: LibraryAssetView) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [state, setState] = useState<"idle" | "signing" | "confirming" | "delisted" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function delist() {
    if (!account?.address) {
      setState("error");
      setErrorMessage("Connect the seller wallet before delisting.");
      return;
    }
    setState("signing");
    setErrorMessage("");
    try {
      const transaction = buildDelistListingTransaction({
        listingId: asset.listingId,
        listingInitialSharedVersion: asset.listingInitialSharedVersion,
      });
      const txResult = await signAndExecute.mutateAsync({ transaction });
      setState("confirming");
      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: { showEvents: true, showObjectChanges: true },
      });
      const delistedEvent = getListingDelistedEvent(finalized);
      const transferredPass = getTransferredPassChange(finalized);
      const passId =
        delistedEvent?.pass_id ||
        (typeof transferredPass?.objectId === "string" ? transferredPass.objectId : asset.passId);
      const response = await fetch("/api/delist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: asset.listingId,
          passId,
          sellerAddress: account.address,
          transactionDigest: txResult.digest,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Delist sync failed");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library"] }),
        queryClient.invalidateQueries({ queryKey: ["marketplace"] }),
      ]);
      setState("delisted");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Delist transaction failed.");
    }
  }

  return { delist, state, errorMessage };
}

function EditionChip({
  item,
}: {
  item: Pick<MarketplaceListing, "editionsMinted" | "editionTotal" | "soldOut">;
}) {
  if (item.soldOut) {
    return <span className="tag" style={{ color: "#c0392b", borderColor: "#c0392b" }}>[ SOLD OUT ]</span>;
  }
  return (
    <span className="tag">
      [ ED {item.editionsMinted}/{item.editionTotal} ]
    </span>
  );
}

export function ListingCard({ item }: { item: MarketplaceListing }) {
  const { buy, state, account, errorMessage } = usePurchase(item);
  const buyDisabled =
    state === "buying" || state === "owned" || !account?.address || item.soldOut;

  return (
    <article className="surface surface-interactive flex flex-col bg-[var(--paper)]">
      <PreviewImage heightClass="h-48" item={item} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="mono text-[15px] font-medium leading-tight tracking-[0.02em]">
            {item.title}
          </h3>
          {item.verified ? <VerifiedBadge /> : null}
        </div>
        <p className="mono min-h-[3rem] text-[12px] leading-6 text-[var(--ink-60)]">
          {item.description}
        </p>
        <div className="mono flex items-center justify-between text-[11px] tracking-[0.04em] text-[var(--ink-60)]">
          <span>@{item.seller.replace(/^@/, "")}</span>
          <span>{item.date}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <EditionChip item={item} />
          {!item.soldOut && item.editionTotal > 1 ? (
            <span className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
              {item.editionsRemaining} LEFT
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--ink-16)] pt-4">
          <div>
            <div className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
              PRICE
            </div>
            <div className="mono mt-1 text-[20px] font-medium tabular-nums">
              {item.price}
              <span className="ml-1 text-[12px] text-[var(--ink-40)]">SUI</span>
            </div>
          </div>
          <button
            className="button-primary"
            disabled={buyDisabled}
            onClick={buy}
            type="button"
          >
            {item.soldOut
              ? "[ SOLD OUT ]"
              : state === "buying"
                ? "[ ... ]"
                : state === "owned"
                  ? "[ OWNED ]"
                  : "[ BUY ]"}
          </button>
        </div>
        {state === "error" ? (
          <p className="mono text-[11px] text-[#c0392b]">{errorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

export function FeatureListing({ item }: { item: MarketplaceListing }) {
  const { buy, state, account, errorMessage } = usePurchase(item);
  const buyDisabled =
    state === "buying" || state === "owned" || !account?.address || item.soldOut;

  return (
    <article className="surface surface-interactive grid gap-0 bg-[var(--paper)] md:grid-cols-[280px_1fr]">
      <PreviewImage heightClass="min-h-64 md:min-h-full" item={item} />
      <div className="flex flex-col justify-between gap-6 p-7">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="tag" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" }}>
              [ FEATURED ]
            </span>
            <span className="tag tag-signal">[ WALRUS ]</span>
            {item.verified ? <VerifiedBadge /> : null}
            <EditionChip item={item} />
          </div>
          <h2 className="display text-[clamp(26px,3vw,40px)]">{item.title}</h2>
          <p className="mono text-[13px] leading-7 text-[var(--ink-60)]">
            {item.description}
          </p>
          <div className="grid grid-cols-3 gap-4 border-y border-[var(--ink-16)] py-4">
            <Stat label="SELLER" value={`@${item.seller.replace(/^@/, "")}`} />
            <Stat label="SIZE" value={item.size} />
            <Stat label="EDITIONS" value={`${item.editionsMinted}/${item.editionTotal}`} />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
              PRICE
            </div>
            <div className="mono text-[32px] font-medium leading-none tabular-nums">
              {item.price}
              <span className="ml-2 text-[14px] text-[var(--ink-40)]">SUI</span>
            </div>
          </div>
          <button className="button-primary" disabled={buyDisabled} onClick={buy} type="button">
            {item.soldOut
              ? "[ SOLD OUT ]"
              : state === "buying"
                ? "[ ... ]"
                : state === "owned"
                  ? "[ OWNED ]"
                  : "[ BUY INSTANT ACCESS ]"}
          </button>
        </div>
        {state === "error" ? (
          <p className="mono text-[11px] text-[#c0392b]">{errorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-[10px] tracking-[0.18em] text-[var(--ink-40)]">
        {label}
      </div>
      <div className="mono mt-1 text-[13px] tracking-[0.02em]">{value}</div>
    </div>
  );
}

export function LibraryCard({ asset }: { asset: LibraryAssetView }) {
  const owned = asset.status === "Owned";
  const listedByUser = asset.status === "Your Listing";
  const topUp = useStorageTopUp(asset);
  const delist = useDelist(asset);
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "error">("idle");
  const [downloadError, setDownloadError] = useState("");

  const storageTone =
    asset.storageHealth === "expired"
      ? { label: "EXPIRED", color: "#c0392b" }
      : asset.storageHealth === "expiring"
        ? { label: "EXPIRING", color: "#d4a853" }
        : { label: "ACTIVE", color: "var(--signal-deep)" };

  return (
    <article className="surface flex flex-col bg-[var(--paper)]">
      <div className="relative">
        <PreviewImage heightClass="h-52" item={asset} />
        <span
          className="tag absolute left-2 top-2 z-[3]"
          style={{
            background: owned ? "var(--signal)" : "var(--ink)",
            color: owned ? "var(--ink)" : "var(--paper)",
            borderColor: owned ? "var(--signal)" : "var(--ink)",
          }}
        >
          [ {asset.status.toUpperCase()} ]
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="mono text-[10px] tracking-[0.18em] text-[var(--signal-deep)]">
            {asset.category.toUpperCase()}
          </div>
          <h3 className="mono mt-1 flex items-center gap-2 text-[16px] font-medium leading-tight">
            {asset.title}
            {asset.verified ? <VerifiedBadge label="VRF" /> : null}
          </h3>
        </div>
        <div className="mono flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink-16)] pt-3 text-[11px] tracking-[0.04em] text-[var(--ink-60)]">
          <span>{asset.date}</span>
          <span className="tabular-nums">{asset.blobLabel}</span>
        </div>
        {asset.price ? (
          <div className="mono flex items-center justify-between text-[13px]">
            <span className="text-[var(--ink-40)]">LIST PRICE</span>
            <strong className="tabular-nums">{asset.price}</strong>
          </div>
        ) : null}
        {asset.editionTotal > 1 || asset.soldOut ? (
          <div className="mono flex items-center justify-between text-[13px]">
            <span className="text-[var(--ink-40)]">EDITIONS</span>
            <strong
              className="tabular-nums"
              style={{ color: asset.soldOut ? "#c0392b" : "var(--ink)" }}
            >
              {asset.soldOut ? "SOLD OUT" : `${asset.editionsMinted}/${asset.editionTotal}`}
            </strong>
          </div>
        ) : null}

        {/* Keep-alive block */}
        <div className="border border-[var(--ink-16)] p-3">
          <div className="mono mb-2 flex items-center justify-between gap-3 text-[11px] tracking-[0.12em]">
            <span style={{ color: storageTone.color }}>
              [ {storageTone.label} ] STORAGE
            </span>
            <span className="text-[var(--ink-40)] tabular-nums">
              EP {asset.storageEndEpoch}
            </span>
          </div>
          <div className="mono flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ink-60)]">
            <span>{asset.storageRenewalLabel}</span>
            <button
              className="button-secondary"
              style={{ minHeight: 32, fontSize: 11, padding: "0 0.75rem" }}
              disabled={topUp.state === "signing" || topUp.state === "confirming" || !asset.fileHash}
              onClick={() => void topUp.topUp(1)}
              type="button"
            >
              {topUp.state === "signing"
                ? "[ SIGN ]"
                : topUp.state === "confirming"
                  ? "[ SYNC... ]"
                  : "[ TOP UP +1EP ]"}
            </button>
          </div>
          {topUp.errorMessage ? (
            <p className="mono mt-2 text-[11px] text-[#c0392b]">{topUp.errorMessage}</p>
          ) : null}
        </div>

        {listedByUser ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <a className="button-secondary w-full" href="/marketplace">
              [ VIEW LISTING ]
            </a>
            <button
              className="button-primary w-full"
              disabled={delist.state === "signing" || delist.state === "confirming" || delist.state === "delisted"}
              onClick={() => void delist.delist()}
              type="button"
            >
              {delist.state === "signing"
                ? "[ SIGN ]"
                : delist.state === "confirming"
                  ? "[ ... ]"
                  : delist.state === "delisted"
                    ? "[ DELISTED ]"
                    : "[ DELIST ]"}
            </button>
          </div>
        ) : owned && asset.rawFileBlobId ? (
          <button
            className="button-primary w-full"
            disabled={downloadState === "downloading"}
            onClick={async () => {
              const search = new URLSearchParams(asset.downloadUrl?.split("?")[1] ?? "");
              const walletAddress = search.get("address");
              if (!walletAddress) {
                setDownloadState("error");
                setDownloadError("No wallet address was attached to this asset download.");
                return;
              }
              setDownloadState("downloading");
              setDownloadError("");
              const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  passId: asset.passId,
                  blobId: asset.rawFileBlobId,
                  walletAddress,
                }),
              });
              if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                setDownloadState("error");
                setDownloadError(payload?.error || "Access denied: this wallet does not own the required Blob Pass.");
                return;
              }
              const blob = await response.blob();
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = downloadUrl;
              link.download = `${asset.title}.bin`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(downloadUrl);
              setDownloadState("idle");
            }}
            type="button"
          >
            {downloadState === "downloading" ? "[ DOWNLOADING... ]" : `[ ${asset.action.toUpperCase()} ]`}
          </button>
        ) : (
          <a
            className={owned ? "button-primary w-full" : "button-secondary w-full"}
            href={asset.downloadUrl ?? "/marketplace"}
          >
            [ {asset.action.toUpperCase()} ]
          </a>
        )}
        {downloadError ? (
          <p className="mono text-[11px] text-[#c0392b]">{downloadError}</p>
        ) : null}
        {delist.errorMessage ? (
          <p className="mono text-[11px] text-[#c0392b]">{delist.errorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

export function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="surface bg-[var(--paper)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="mono text-[11px] tracking-[0.18em] text-[var(--ink-40)]">
          {label}
        </span>
        <span className="text-[var(--signal-deep)]" aria-hidden>
          {icon}
        </span>
      </div>
      <div className="display text-[40px] leading-none tabular-nums">{value}</div>
      <div className="ascii-rule mt-4" />
      <p className="mono mt-4 text-[12px] leading-6 text-[var(--ink-60)]">{note}</p>
    </div>
  );
}
