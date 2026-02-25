"use client";

import { useState } from "react";
import Link from "next/link";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import EligibilityForm from "@/components/eligibility-form";
import PaymentSelector from "@/components/payment-selector";
import CzusdConverter from "@/components/czusd-converter";
import {
  usePoolName,
  usePoolStatus,
  usePoolVerificationType,
  usePurchasePolicy,
} from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";
import { verificationTypeToString } from "@/lib/types";
import { thirdwebClient } from "@/lib/thirdweb";
import type { VerificationType } from "@/lib/mock-data";

const avalancheFuji = defineChain(43113);

const STEPS = ["Eligibility", "Payment", "Confirm"];

export default function AcquireClient({
  poolAddress,
}: {
  poolAddress: string;
}) {
  const [step, setStep] = useState(0);
  const [proofHash, setProofHash] = useState<string>("");
  const [purchaseTxPending, setPurchaseTxPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const account = useActiveAccount();
  const { data: nativeBalance } = useWalletBalance({
    address: account?.address,
    chain: avalancheFuji,
    client: thirdwebClient!,
  });

  const insufficientGas =
    nativeBalance !== undefined && BigInt(nativeBalance.value) === 0n;

  const { data: poolName, isLoading: nameLoading } = usePoolName(poolAddress);
  const { data: poolStatus, isLoading: statusLoading } =
    usePoolStatus(poolAddress);
  const { data: verificationTypeRaw } = usePoolVerificationType(poolAddress);

  const { purchase, isPending: purchaseIsPending } =
    usePurchasePolicy(poolAddress);

  // Extract values from poolStatus tuple:
  // (state, totalUnderwritten, totalPremiums, policyholderCount, maxPolicyholders, poolEndTimestamp, premiumAmount, maxPayoutPerPolicy)
  const poolState = poolStatus
    ? Number((poolStatus as readonly bigint[])[0])
    : 0;
  const policyholderCount = poolStatus
    ? Number((poolStatus as readonly bigint[])[3])
    : 0;
  const maxPolicyholders = poolStatus
    ? Number((poolStatus as readonly bigint[])[4])
    : 0;
  const premiumAmount = poolStatus ? (poolStatus as readonly bigint[])[6] : 0n;
  const maxPayout = poolStatus ? (poolStatus as readonly bigint[])[7] : 0n;

  const poolFull =
    policyholderCount >= maxPolicyholders && maxPolicyholders > 0;
  const poolNotActive = poolState !== 1; // 1 = ACTIVE

  const verificationType: VerificationType =
    verificationTypeRaw !== undefined
      ? (verificationTypeToString(
          Number(verificationTypeRaw),
        ) as VerificationType)
      : "none";

  const isLoading = nameLoading || statusLoading;

  const handleConfirmPurchase = async () => {
    try {
      setPurchaseTxPending(true);
      setPurchaseError(null);
      await purchase();
      setConfirmed(true);
      setPurchaseTxPending(false);
    } catch {
      setPurchaseError("Purchase transaction failed. Please try again.");
      setPurchaseTxPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-secondary" />
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="h-64 rounded-lg bg-secondary" />
        </div>
      </div>
    );
  }

  if (poolFull || poolNotActive) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-primary">
          Acquire Coverage
        </h1>
        <p className="mb-4 text-center text-sm text-muted-fg">
          {poolName || "Loading..."}
        </p>
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <div className="rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
            {poolFull
              ? `This pool is full (${policyholderCount}/${maxPolicyholders} policyholders).`
              : "This pool is not currently accepting new policies."}
          </div>
          <Link
            href={`/policies/${poolAddress}`}
            className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-muted-fg hover:text-primary"
          >
            Back to Policy Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-center text-2xl font-bold text-primary">
        Acquire Coverage
      </h1>
      <p className="mb-6 text-center text-sm text-muted-fg">
        {poolName || "Loading..."}
      </p>

      {/* Progress bar */}
      <div className="mx-auto mb-8 flex max-w-md items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i <= step
                  ? "bg-primary text-background"
                  : "bg-secondary text-dim"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${i <= step ? "text-primary" : "text-dim"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {step === 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Verify Eligibility
            </h2>
            <EligibilityForm
              verificationType={verificationType}
              poolAddress={poolAddress}
              onResult={(result) => {
                if (result.eligible && result.proofHash) {
                  setProofHash(result.proofHash);
                  setStep(1);
                }
              }}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Payment</h2>
            <div className="mb-4">
              <CzusdConverter />
            </div>
            <PaymentSelector
              poolAddress={poolAddress}
              premiumAmount={premiumAmount as bigint}
              onPayment={() => setStep(2)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Confirm Coverage
            </h2>
            <div className="space-y-2 rounded-lg bg-secondary p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-fg">Policy</span>
                <span className="text-primary">{poolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">Premium</span>
                <span className="font-mono text-primary">
                  {formatCZUSD(premiumAmount as bigint)} CZUSD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">Max Payout</span>
                <span className="font-mono text-primary">
                  {formatCZUSD(maxPayout as bigint)} CZUSD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">Proof Hash</span>
                <span className="max-w-[200px] truncate font-mono text-xs text-dim">
                  {proofHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">ACE Compliance</span>
                <span className="text-green-400">Verified</span>
              </div>
            </div>

            {insufficientGas && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                Insufficient AVAX for gas fees. Fund your wallet with Fuji AVAX
                to proceed.
              </div>
            )}

            {purchaseError && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {purchaseError}
              </div>
            )}

            {confirmed ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-green-900/20 p-4 text-center text-sm text-green-400">
                  Coverage acquired. PolicyNFT minted.
                </div>
                <Link
                  href="/coverage"
                  className="block w-full rounded-lg bg-primary py-2 text-center text-sm font-medium text-background"
                >
                  View My Coverage
                </Link>
              </div>
            ) : (
              <button
                onClick={handleConfirmPurchase}
                disabled={
                  purchaseTxPending || purchaseIsPending || insufficientGas
                }
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {purchaseTxPending || purchaseIsPending
                  ? "Purchasing..."
                  : "Confirm & Mint PolicyNFT"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
