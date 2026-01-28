"use client";

import { useState, useEffect } from "react";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// x402 v2 Client
import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
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
  const [showReveal, setShowReveal] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const DEMO_PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;

  useEffect(() => {
    if (DEMO_PRIVATE_KEY) {
      try {
        const normalizedKey = DEMO_PRIVATE_KEY.startsWith("0x")
          ? DEMO_PRIVATE_KEY
          : `0x${DEMO_PRIVATE_KEY}`;
        const signer = privateKeyToAccount(normalizedKey as `0x${string}`);
        const x402client = new x402Client();
        registerExactEvmScheme(x402client, { signer });
        const wrappedFetch = wrapFetchWithPayment(fetch, x402client);
        setWalletAddress(signer.address);
        setFetchWithPayment(() => wrappedFetch);
      } catch (err: any) {
        setError(`Failed to init: ${err.message}`);
      }
    }
  }, [DEMO_PRIVATE_KEY]);

  const handleGetFortune = async () => {
    if (!fetchWithPayment) {
      setError("Wallet not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    setFortune(null);
    setShowReveal(false);

    try {
      const res = await fetchWithPayment("/api/fortune");
      if (!res.ok && res.status !== 402) {
        throw new Error(`Request failed: ${res.status}`);
      }
      if (res.status === 402) {
        throw new Error("Payment not processed");
      }

      // Check for transaction hash in headers
      try {
        const httpClient = new x402HTTPClient(new x402Client());
        const settleResponse = httpClient.getPaymentSettleResponse((name) => res.headers.get(name));
        if (settleResponse && settleResponse.transaction) {
          setTxHash(settleResponse.transaction);
        }
      } catch (e) {
        console.warn("Failed to parse payment headers:", e);
      }

      const data = await res.json();
      // Trigger reveal animation
      setShowReveal(true);
      setTimeout(() => {
        setFortune(data.fortune);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-amber-950/20 text-zinc-100 p-8">
      {/* Floating particles effect via gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <main className="relative flex flex-col gap-6 items-center max-w-lg w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
            🥠 Fortune Cookie
          </h1>
          <p className="text-amber-400/80 text-sm tracking-wide">
            Powered by x402 v2
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-zinc-800/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-8 shadow-2xl shadow-amber-900/10">
          {!walletAddress ? (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">🔮</div>
              <p className="text-zinc-300 text-lg">
                {DEMO_PRIVATE_KEY
                  ? "Connecting to the mystical realm..."
                  : "Configure your wallet to peek into destiny"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Status */}
              <div className="flex justify-between items-center bg-zinc-900/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                  <span className="text-zinc-300 font-medium">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                  </span>
                </div>
                <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">
                  Connected
                </span>
              </div>

              {/* Fortune Display */}
              <div className="min-h-[180px] flex items-center justify-center bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-xl p-8 border border-amber-500/10 relative overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg" />

                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-5xl animate-spin">🥠</div>
                    <p className="text-amber-400 animate-pulse text-lg">
                      Cracking open your fortune...
                    </p>
                  </div>
                ) : showReveal && !fortune ? (
                  <div className="text-6xl animate-ping">✨</div>
                ) : fortune ? (
                  <div className="text-center space-y-3 animate-fade-in">
                    <div className="text-4xl">🌟</div>
                    <p className="text-xl font-serif italic text-amber-100 leading-relaxed">
                      "{fortune}"
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-5xl opacity-50">🥠</div>
                    <p className="text-zinc-400 text-lg">
                      Crack open a cookie to reveal your destiny
                    </p>
                  </div>
                )}
              </div>

              {/* Transaction Info */}
              {txHash && (
                <div className="bg-zinc-900/40 rounded-lg p-3 border border-teal-900/50 animate-fade-in">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Transaction Confirmed</span>
                    <code className="text-[10px] text-teal-300 font-mono break-all bg-black/20 p-2 rounded">
                      {txHash}
                    </code>
                    <a
                      href={`https://sepolia.basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-200 underline mt-1"
                    >
                      View on Base Explorer &rarr;
                    </a>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleGetFortune}
                disabled={loading || !fetchWithPayment}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg text-zinc-900 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
                type="button"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🥠</span>
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🥠 Open Fortune Cookie
                    <span className="text-sm font-normal opacity-80">
                      ($0.01 USDC)
                    </span>
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 mt-4">
          <p className="text-zinc-200 text-sm">Base Sepolia • USDC</p>
        </div>
      </main>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
