"use client";

import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function getPublicSuiRpcUrl(network: "testnet" | "mainnet") {
  const sharedRpcUrl = process.env.NEXT_PUBLIC_TATUM_SUI_RPC;

  if (sharedRpcUrl) {
    return sharedRpcUrl;
  }

  if (network === "mainnet") {
    return (
      process.env.NEXT_PUBLIC_TATUM_SUI_MAINNET_URL ||
      "https://sui-mainnet.gateway.tatum.io"
    );
  }

  return (
    process.env.NEXT_PUBLIC_TATUM_SUI_TESTNET_URL ||
    "https://sui-testnet.gateway.tatum.io"
  );
}

const { networkConfig } = createNetworkConfig({
  testnet: {
    network: "testnet",
    url: getPublicSuiRpcUrl("testnet"),
  },
  mainnet: {
    network: "mainnet",
    url: getPublicSuiRpcUrl("mainnet"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider defaultNetwork="testnet" networks={networkConfig}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
