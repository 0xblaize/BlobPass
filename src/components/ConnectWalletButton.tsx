"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function ConnectWalletButton() {
  return (
    <ConnectButton
      className="button-primary min-h-12 rounded-full px-8 text-base"
      connectText="Connect Wallet"
    />
  );
}
