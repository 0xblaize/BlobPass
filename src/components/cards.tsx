"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  Download,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  buildBuyListingTransaction,
  buildStorageTopUpTransaction,
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

function PreviewImage({
  item,
  heightClass,
}: {
  item: Pick<MarketplaceListing | LibraryAssetView, "previewImageUrl" | "gradient" | "category">;
  heightClass: string;
}) {
  return (
    <div className={`asset-image relative overflow-hidden bg-gradient-to-br ${item.gradient} ${heightClass}`}>
      {item.previewImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover opacity-80" src={item.previewImageUrl} />
      ) : (
        <ImageIcon
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400/70"
          size={52}
        />
      )}
      <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-black text-cyan-300">
        WALRUS
      </span>
      <span className="absolute bottom-4 left-4 rounded-full border border-cyan-300/50 bg-cyan-400/30 px-3 py-1 text-xs font-bold text-cyan-100">
        {item.category}
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

      const txResult = await signAndExecute.mutateAsync({
        transaction,
      });

      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const purchasedEvent = getListingPurchasedEvent(finalized);
      const transferredPass = getTransferredPassChange(finalized);
      const passId =
        purchasedEvent?.pass_id || (typeof transferredPass?.objectId === "string" ? transferredPass.objectId : undefined);

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

      const txResult = await signAndExecute.mutateAsync({
        transaction,
      });

      setState("confirming");

      await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
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

export function ListingCard({ item }: { item: MarketplaceListing }) {
  const { buy, state, account, errorMessage } = usePurchase(item);

  return (
    <article className="panel overflow-hidden rounded-lg">
      <PreviewImage heightClass="h-44" item={item} />
      <div className="space-y-4 p-5">
        <h3 className="text-xl font-black">{item.title}</h3>
        <p className="min-h-12 text-sm leading-6 text-zinc-400">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{item.seller}</span>
          <span>{item.date}</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-zinc-400">PRICE</div>
            <div className="title text-2xl text-cyan-300">{item.price} SUI</div>
          </div>
          <button
            className="button-primary min-h-10 px-4 text-sm"
            disabled={state === "buying" || state === "owned" || !account?.address}
            onClick={buy}
            type="button"
          >
            {state === "buying" ? "Buying..." : state === "owned" ? "Owned" : "Buy Access"}
          </button>
        </div>
        {state === "error" ? (
          <p className="text-xs font-bold text-red-300">{errorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

export function FeatureListing({ item }: { item: MarketplaceListing }) {
  const { buy, state, account, errorMessage } = usePurchase(item);

  return (
    <article className="panel grid gap-5 rounded-xl border-cyan-300/30 p-6 md:grid-cols-[220px_1fr]">
      <PreviewImage heightClass="min-h-56 rounded-lg" item={item} />
      <div className="flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-cyan-300 text-black">Featured</span>
            <span className="chip">Walrus Storage</span>
          </div>
          <h2 className="title text-2xl leading-tight">{item.title}</h2>
          <p className="leading-7 text-zinc-300">{item.description} Processed via Sui-parallel clusters.</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs font-bold text-zinc-500">SELLER</div>
              <div>{item.seller}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500">SIZE</div>
              <div>{item.size}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-500">PURCHASES</div>
              <div>{item.purchases}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="title text-3xl text-cyan-300">{item.price} SUI</div>
          <button
            className="button-primary"
            disabled={state === "buying" || state === "owned" || !account?.address}
            onClick={buy}
            type="button"
          >
            {state === "buying" ? "Buying..." : state === "owned" ? "Owned" : "Buy Instant Access"}
            <ArrowRight size={18} />
          </button>
        </div>
        {state === "error" ? (
          <p className="text-xs font-bold text-red-300">{errorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

export function LibraryCard({ asset }: { asset: LibraryAssetView }) {
  const owned = asset.status === "Owned";
  const topUp = useStorageTopUp(asset);
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "error">("idle");
  const [downloadError, setDownloadError] = useState("");
  const storageTone =
    asset.storageHealth === "expired"
      ? "border-red-400/30 bg-red-400/10 text-red-200"
      : asset.storageHealth === "expiring"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-cyan-300/25 bg-cyan-300/8 text-cyan-100";

  return (
    <article className="panel overflow-hidden rounded-lg">
      <div className="relative">
        <PreviewImage heightClass="h-48" item={asset} />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${
            owned ? "bg-cyan-300 text-black" : "bg-black text-white"
          }`}
        >
          {asset.status}
        </span>
        <span className="absolute bottom-3 right-3 rounded-md border border-white/15 bg-black/70 px-3 py-1 text-xs font-black">
          WALRUS ONLINE
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-cyan-300">{asset.category}</div>
            <h3 className="mt-1 text-xl font-black">{asset.title}</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs text-zinc-400">
          <span>{asset.date}</span>
          <span>{asset.blobLabel}</span>
        </div>
        {asset.price ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">List Price</span>
            <strong className="text-cyan-300">{asset.price}</strong>
          </div>
        ) : null}
        <div className={`rounded-lg border p-4 text-sm ${storageTone}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-black">
              <Clock size={16} /> Keep-Alive
            </span>
            <span className="mono text-xs">Epoch {asset.storageEndEpoch}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{asset.storageRenewalLabel}</span>
            <button
              className="button-secondary min-h-9 px-3 text-xs"
              disabled={topUp.state === "signing" || topUp.state === "confirming" || !asset.fileHash}
              onClick={() => void topUp.topUp(1)}
              type="button"
            >
              <RefreshCw size={14} />
              {topUp.state === "signing"
                ? "Sign"
                : topUp.state === "confirming"
                  ? "Syncing"
                  : "Top Up"}
            </button>
          </div>
          {topUp.errorMessage ? <p className="mt-3 text-xs font-bold text-red-200">{topUp.errorMessage}</p> : null}
        </div>
        {owned && asset.rawFileBlobId ? (
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
                headers: {
                  "Content-Type": "application/json",
                },
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
            <Download size={17} />
            {downloadState === "downloading" ? "Downloading..." : asset.action}
          </button>
        ) : (
          <a
            className={owned ? "button-primary w-full" : "button-secondary w-full"}
            href={asset.downloadUrl ?? "/marketplace"}
          >
            {owned ? <Download size={17} /> : <ExternalLink size={17} />}
            {asset.action}
          </a>
        )}
        {downloadError ? <p className="text-xs font-bold text-red-300">{downloadError}</p> : null}
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
    <div className="panel rounded-lg p-7">
      <div className="mb-8 flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-black text-cyan-300">{icon}</div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-zinc-400">
          Live Stats
        </span>
      </div>
      <div className="text-xs font-black uppercase text-zinc-500">{label}</div>
      <div className="title mt-1 text-3xl">{value}</div>
      <p className="mt-4 text-sm text-zinc-400">{note}</p>
    </div>
  );
}

export const cardIcons = { ShieldCheck, Wallet };
