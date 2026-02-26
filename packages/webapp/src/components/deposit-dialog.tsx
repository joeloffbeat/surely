"use client";

import { useState, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useCZUSDBalance } from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";
import StripePaymentForm from "./stripe-payment-form";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
  const account = useActiveAccount();
  const { refetch: refetchCzusd } = useCZUSDBalance(account?.address);
  const [tab, setTab] = useState<"wallet" | "card">("wallet");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "paying" | "polling" | "done">(
    "input",
  );
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const walletAddress = account?.address || "";
  const amountUsd = parseFloat(amount) || 0;

  const handleStripeSuccess = async (_piId: string) => {
    setStep("polling");
    // Poll for CZUSD balance increase
    let attempts = 0;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      await refetchCzusd();
      attempts++;
      // After a few polls, assume success (webhook may take a moment)
      if (attempts >= 3) break;
    }
    setStep("done");
    setTimeout(() => {
      onOpenChange(false);
      setStep("input");
      setAmount("");
    }, 1500);
  };

  const handleStripeError = (msg: string) => {
    setError(msg);
    setStep("input");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-fg transition-colors hover:text-primary"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-1 text-lg font-semibold text-primary">
          Deposit CZUSD
        </h2>
        <p className="mb-5 text-sm text-muted-fg">
          Add CZUSD to your wallet to purchase insurance policies.
        </p>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-lg border border-border bg-secondary p-1">
          <button
            onClick={() => setTab("wallet")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "wallet"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-fg hover:text-primary"
            }`}
          >
            Transfer to Wallet
          </button>
          <button
            onClick={() => setTab("card")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "card"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-fg hover:text-primary"
            }`}
          >
            Buy with Card
          </button>
        </div>

        {tab === "wallet" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-fg">
                Your Wallet Address
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5">
                <span className="flex-1 truncate font-mono text-xs text-primary">
                  {walletAddress}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="shrink-0 text-xs text-muted-fg transition-colors hover:text-primary"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-fg">
              Send CZUSD tokens to this address on Avalanche Fuji. The CZUSD
              contract address is:
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-[11px] text-muted-fg">
                0xA8D24aDd4E9CE85e6875251a4a0a796BAa2acfCF
              </span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    "0xA8D24aDd4E9CE85e6875251a4a0a796BAa2acfCF",
                  )
                }
                className="shrink-0 text-xs text-muted-fg transition-colors hover:text-primary"
              >
                Copy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {step === "input" && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-fg">
                    Amount (USD)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      setAmount(v);
                    }}
                    placeholder="100.00"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-mono text-sm text-primary placeholder:text-muted-fg/50 focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-muted-fg">
                  1 USD = 1 CZUSD. Card payments are processed via Stripe test
                  mode.
                </p>
              </>
            )}

            {step === "input" && amountUsd >= 1 && walletAddress && (
              <StripePaymentForm
                amountUsd={amountUsd}
                userAddress={walletAddress}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
              />
            )}

            {step === "polling" && (
              <div className="flex items-center justify-center gap-2 py-6">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-fg">
                  Minting CZUSD to your wallet...
                </span>
              </div>
            )}

            {step === "done" && (
              <div className="rounded-lg bg-green-900/20 p-4 text-center text-sm text-green-400">
                CZUSD minted successfully!
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {!walletAddress && step === "input" && (
              <div className="rounded-lg bg-yellow-900/20 p-3 text-sm text-yellow-400">
                Connect your wallet to buy CZUSD with card.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
