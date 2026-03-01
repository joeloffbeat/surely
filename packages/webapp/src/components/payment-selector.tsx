"use client";

import { useState, useCallback } from "react";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import { useApproveCZUSD, useCZUSDBalance } from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";
import { thirdwebClient } from "@/lib/thirdweb";
import StripePaymentForm from "./stripe-payment-form";

const avalancheFuji = defineChain(43113);

type PaymentMethod = "czusd" | "stripe";

interface PaymentSelectorProps {
  poolAddress: string;
  premiumAmount: bigint;
  onPayment: () => void;
}

export default function PaymentSelector({
  poolAddress,
  premiumAmount,
  onPayment,
}: PaymentSelectorProps) {
  const [method, setMethod] = useState<PaymentMethod>("czusd");
  const [processing, setProcessing] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeStep, setStripeStep] = useState<
    "idle" | "paid" | "polling" | "approving" | "done"
  >("idle");
  const { approve, isPending } = useApproveCZUSD();

  const account = useActiveAccount();
  const { data: czusdBalance, refetch: refetchCzusd } = useCZUSDBalance(
    account?.address,
  );
  const { data: nativeBalance } = useWalletBalance({
    address: account?.address,
    chain: avalancheFuji,
    client: thirdwebClient!,
  });

  const insufficientCZUSD =
    czusdBalance !== undefined && czusdBalance < premiumAmount;
  const insufficientGas =
    nativeBalance !== undefined && BigInt(nativeBalance.value) === 0n;

  const formattedPremium = formatCZUSD(premiumAmount);
  const usdAmount = parseFloat(formattedPremium);

  // CZUSD Direct payment
  const handleCzusdPay = async () => {
    setProcessing(true);
    setError(null);
    try {
      await approve(poolAddress, premiumAmount);
      setApproved(true);
      onPayment();
    } catch (err) {
      console.error("Approve failed:", err);
      setError("Approval transaction failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // After Stripe payment succeeds, poll for CZUSD mint then approve
  const handleStripeSuccess = useCallback(
    async (_paymentIntentId: string) => {
      if (!account?.address) return;
      setError(null);
      setStripeStep("polling");

      try {
        // Poll for CZUSD balance increase (webhook mints async)
        const startBalance = czusdBalance ?? 0n;
        let attempts = 0;
        while (attempts < 30) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data: newBalance } = await refetchCzusd();
          if (newBalance !== undefined && newBalance > startBalance) break;
          attempts++;
        }

        // Approve CZUSD to pool
        setStripeStep("approving");
        await approve(poolAddress, premiumAmount);

        setStripeStep("done");
        setApproved(true);
        onPayment();
      } catch (err) {
        console.error("Post-payment flow failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Post-payment processing failed.",
        );
        setStripeStep("idle");
      }
    },
    [
      account?.address,
      czusdBalance,
      refetchCzusd,
      approve,
      poolAddress,
      premiumAmount,
      onPayment,
    ],
  );

  const handleStripeError = useCallback((message: string) => {
    setError(message);
    setStripeStep("idle");
  }, []);

  const czusdDisabled =
    processing ||
    isPending ||
    approved ||
    insufficientCZUSD ||
    insufficientGas ||
    !account?.address;

  return (
    <div className="space-y-4">
      {/* Method tabs */}
      <div className="flex gap-2 rounded-lg bg-secondary p-1">
        <button
          onClick={() => {
            setMethod("czusd");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            method === "czusd"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-fg hover:text-primary"
          }`}
        >
          CZUSD Wallet
        </button>
        <button
          onClick={() => {
            setMethod("stripe");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            method === "stripe"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-fg hover:text-primary"
          }`}
        >
          Pay with Card
        </button>
      </div>

      {/* Payment info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-fg">Premium</span>
          <span className="font-mono text-primary">
            {formattedPremium} CZUSD
          </span>
        </div>
        {method === "czusd" && (
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-fg">Your CZUSD Balance</span>
            <span
              className={`font-mono ${insufficientCZUSD ? "text-red-400" : "text-primary"}`}
            >
              {czusdBalance !== undefined
                ? `${formatCZUSD(czusdBalance)} CZUSD`
                : "Loading..."}
            </span>
          </div>
        )}
        {method === "stripe" && (
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-fg">Card Amount</span>
            <span className="font-mono text-primary">
              ${usdAmount.toFixed(2)} USD
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-fg">Payment Method</span>
          <span className="text-primary">
            {method === "czusd" ? "CZUSD Direct" : "Stripe (Test Mode)"}
          </span>
        </div>
      </div>

      {/* Stripe payment form */}
      {method === "stripe" &&
        stripeStep === "idle" &&
        !approved &&
        account?.address && (
          <StripePaymentForm
            amountUsd={usdAmount}
            userAddress={account.address}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
          />
        )}

      {/* Stripe processing steps (post-payment) */}
      {method === "stripe" &&
        stripeStep !== "idle" &&
        stripeStep !== "done" && (
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <StepIndicator label="Card payment confirmed" status="done" />
            <StepIndicator
              label="Waiting for CZUSD mint"
              status={
                stripeStep === "polling"
                  ? "active"
                  : stripeStep === "approving"
                    ? "done"
                    : "pending"
              }
            />
            <StepIndicator
              label="Approving CZUSD for pool"
              status={stripeStep === "approving" ? "active" : "pending"}
            />
          </div>
        )}

      {/* Errors */}
      {method === "czusd" && insufficientCZUSD && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          Insufficient CZUSD balance. You need{" "}
          <span className="font-mono">{formattedPremium} CZUSD</span> but have{" "}
          <span className="font-mono">
            {formatCZUSD(czusdBalance ?? 0n)} CZUSD
          </span>
          .
        </div>
      )}

      {method === "czusd" && insufficientGas && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          Insufficient AVAX for gas fees. Fund your wallet with Fuji AVAX to
          proceed.
        </div>
      )}

      {!account?.address && (
        <div className="rounded-lg bg-yellow-900/20 p-3 text-sm text-yellow-400">
          Connect your wallet to proceed with payment.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action button (CZUSD only — Stripe has its own submit) */}
      {approved ? (
        <div className="rounded-lg bg-green-900/20 p-3 text-center text-sm text-green-400">
          Payment approved successfully. Proceeding...
        </div>
      ) : method === "czusd" ? (
        <button
          onClick={handleCzusdPay}
          disabled={czusdDisabled}
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {processing || isPending
            ? "Approving CZUSD..."
            : `Approve ${formattedPremium} CZUSD`}
        </button>
      ) : null}

      {/* Info note for Stripe */}
      {method === "stripe" && stripeStep === "idle" && !approved && (
        <p className="text-center text-xs text-dim">
          Card payment will mint CZUSD to your wallet, then approve it for the
          pool. You&apos;ll sign one wallet transaction for the approval.
        </p>
      )}
    </div>
  );
}

function StepIndicator({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "done" && <span className="text-green-400">&#10003;</span>}
      {status === "active" && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
      {status === "pending" && (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-border" />
      )}
      <span
        className={
          status === "done"
            ? "text-green-400"
            : status === "active"
              ? "text-primary"
              : "text-dim"
        }
      >
        {label}
      </span>
    </div>
  );
}
