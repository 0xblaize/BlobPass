"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  buildBuyListingTransaction,
  getListingPurchasedEvent,
  getTransferredPassChange,
} from "@/lib/blobpass/sui";

type Props = {
  listed: boolean;
  listingId: string;
  listingInitialSharedVersion?: string;
  passId: string;
  priceMist: string;
  soldOut: boolean;
};

export function AssetDetailActions({
  listed,
  listingId,
  listingInitialSharedVersion,
  passId,
  priceMist,
  soldOut,
}: Props) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();
  const signAndExecute = useSignAndExecuteTransaction();
  const [state, setState] = useState<"idle" | "buying" | "owned" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!listed) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[12px] tracking-[0.16em] text-[var(--ink-40)]">
          This pass is currently held off-market.
        </span>
        <Link className="button-secondary" href="/library">
          [ MANAGE IN LIBRARY ]
        </Link>
      </div>
    );
  }

  async function buy() {
    if (!account?.address) {
      setState("error");
      setErrorMessage("Connect a Sui wallet to purchase.");
      return;
    }
    setState("buying");
    setErrorMessage("");
    try {
      const transaction = buildBuyListingTransaction({
        listingId,
        priceMist,
        listingInitialSharedVersion,
      });
      const txResult = await signAndExecute.mutateAsync({ transaction });
      const finalized = await suiClient.waitForTransaction({
        digest: txResult.digest,
        options: { showEvents: true, showObjectChanges: true },
      });
      const purchasedEvent = getListingPurchasedEvent(finalized);
      const transferredPass = getTransferredPassChange(finalized);
      const buyerPassId =
        purchasedEvent?.pass_id ||
        (typeof transferredPass?.objectId === "string"
          ? transferredPass.objectId
          : undefined);
      await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          passId: buyerPassId ?? passId,
          buyerAddress: account.address,
          transactionDigest: txResult.digest,
        }),
      }).catch(() => null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library"] }),
        queryClient.invalidateQueries({ queryKey: ["marketplace"] }),
      ]);
      setState("owned");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Purchase failed.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="button-primary"
          disabled={state === "buying" || state === "owned" || soldOut}
          onClick={buy}
          type="button"
        >
          {soldOut
            ? "[ SOLD OUT ]"
            : state === "buying"
              ? "[ SIGNING... ]"
              : state === "owned"
                ? "[ OWNED — CHECK LIBRARY ]"
                : "[ BUY INSTANT ACCESS ]"}
        </button>
        <Link className="button-secondary" href="/marketplace">
          [ BACK TO MARKETPLACE ]
        </Link>
        {!account?.address && !soldOut ? (
          <span className="mono text-[11px] tracking-[0.16em] text-[var(--ink-40)]">
            Connect a wallet to buy.
          </span>
        ) : null}
      </div>
      {state === "error" ? (
        <p className="mono text-[11px] text-[#c0392b]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
