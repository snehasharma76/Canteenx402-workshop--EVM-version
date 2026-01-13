"use client";

import { useState, useEffect } from "react";
import { createWalletClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// x402 v2 Client - Following official migration guide
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [fortune, setFortune] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [fetchWithPayment, setFetchWithPayment] = useState<
    ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | null
  >(null);

  const DEMO_PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;

  // Initialize wallet client with x402 v2 pattern
  useEffect(() => {
    // Option 1: Use private key from env (for demo)
    if (DEMO_PRIVATE_KEY) {
      try {
        const normalizedKey = DEMO_PRIVATE_KEY.startsWith("0x")
          ? DEMO_PRIVATE_KEY
          : `0x${DEMO_PRIVATE_KEY}`;

        // Create viem account from private key
        const signer = privateKeyToAccount(normalizedKey as `0x${string}`);

        // x402 v2 pattern: Create x402Client and register EVM scheme
        const x402client = new x402Client();
        registerExactEvmScheme(x402client, { signer });

        // Wrap fetch with payment handling
        const wrappedFetch = wrapFetchWithPayment(fetch, x402client);

        setWalletAddress(signer.address);
        setFetchWithPayment(() => wrappedFetch);
      } catch (err: any) {
        setError(`Failed to init from env: ${err.message}`);
      }
      return;
    }

    // Option 2: Use browser wallet (MetaMask etc) - would need additional setup
    if (typeof window !== "undefined" && window.ethereum) {
      // Browser wallet support would require different approach for v2
      // For now, just show a message
      setError("Please set NEXT_PUBLIC_PRIVATE_KEY in .env.local for demo");
    }
  }, [DEMO_PRIVATE_KEY]);

  const connectBrowserWallet = async () => {
    if (!DEMO_PRIVATE_KEY) {
      setError("Browser wallet not yet supported in this demo. Please use private key in .env.local");
      return;
    }
  };

  const handleGetFortune = async () => {
    if (!fetchWithPayment) {
      setError("Wallet not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    setFortune(null);

    try {
      console.log("Making request with x402 v2 fetchWithPayment...");
      const res = await fetchWithPayment("/api/fortune");
      console.log("Response status:", res.status);

      // x402-fetch should handle 402 automatically
      if (!res.ok && res.status !== 402) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }

      if (res.status === 402) {
        throw new Error("Payment required but not processed. Check wallet funds and network.");
      }

      const data = await res.json();
      setFortune(data.fortune);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to get fortune");
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-zinc-100 p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center max-w-md w-full">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
          EVM Fortune Cookie
        </h1>
        <p className="text-xs text-amber-400">x402 v2</p>

        <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          {!walletAddress ? (
            <div className="text-center space-y-4">
              <p className="text-zinc-400">
                {DEMO_PRIVATE_KEY
                  ? "Initializing demo wallet..."
                  : "Set NEXT_PUBLIC_PRIVATE_KEY in .env.local"}
              </p>
              {!DEMO_PRIVATE_KEY && (
                <button
                  onClick={connectBrowserWallet}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                  type="button"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-mono">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </span>
                <span className="text-green-400 text-xs">Connected</span>
              </div>

              <div className="min-h-[120px] flex items-center justify-center bg-zinc-900/50 rounded-lg p-6 border border-zinc-700/50">
                {loading ? (
                  <div className="animate-pulse text-amber-500">
                    Consulting the oracles...
                  </div>
                ) : fortune ? (
                  <p className="text-lg font-serif italic text-amber-100 text-center">
                    "{fortune}"
                  </p>
                ) : (
                  <p className="text-zinc-500 text-sm text-center">
                    Pay a small fortune to modify your destiny.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center bg-red-900/20 p-2 rounded">
                  {error}
                </p>
              )}

              <button
                onClick={handleGetFortune}
                disabled={loading || !fetchWithPayment}
                className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-black transition-colors"
                type="button"
              >
                {loading ? "Processing..." : "Open Fortune Cookie ($0.01 USDC)"}
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-600 text-center">
          <p>Powered by x402 v2</p>
          <p>Network: Base Sepolia (eip155:84532)</p>
        </div>
      </main>
    </div>
  );
}
