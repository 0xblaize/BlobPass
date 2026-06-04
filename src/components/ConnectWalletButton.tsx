"use client";

import { useImmutableSession } from "@imtbl/auth-next-client";
import { connectWallet } from "@imtbl/wallet";
import { useState, useEffect } from "react";

export function ConnectWalletButton() {
  const { isAuthenticated, getUser } = useImmutableSession();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const initWallet = async () => {
        try {
          const provider = await connectWallet({ getUser });
          const accounts = await provider.request({ method: "eth_requestAccounts" });
          if (accounts && accounts[0]) {
            setWalletAddress(accounts[0] as string);
          }
        } catch (error) {
          console.error("Failed to connect Immutable wallet:", error);
        }
      };
      initWallet();
    }
  }, [isAuthenticated, getUser]);

  const handleLogin = async () => {
    setLoading(true);
    window.location.href = "/api/auth/signin";
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="font-bold">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
          <div className="text-xs font-bold text-cyan-300">Connected</div>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 ring-2 ring-white/20" />
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="button-primary min-h-12 rounded-full px-8 text-base"
    >
      {loading ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
