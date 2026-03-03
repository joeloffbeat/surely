"use client";

import { useState } from "react";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";
import {
  usePoliciesByHolder,
  usePolicyData,
  usePoolName,
} from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";
import { policyStatusToString } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-900/30 text-green-400",
  settled: "bg-blue-900/30 text-blue-400",
  expired: "bg-dim/30 text-dim",
  cancelled: "bg-red-900/30 text-red-400",
};

type StatusFilter = "all" | "active" | "settled" | "expired" | "cancelled";

export default function CoverageClient() {
  const account = useActiveAccount();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: tokenIds, isLoading: policiesLoading } = usePoliciesByHolder(
    account?.address,
  );

  if (!account?.address) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-primary">My Coverage</h1>
        <div className="py-16 text-center">
          <p className="mb-4 text-muted-fg">
            Connect wallet to view your coverage.
          </p>
        </div>
      </div>
    );
  }

  if (policiesLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-primary">My Coverage</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  const ids = tokenIds ?? [];

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-primary">My Coverage</h1>
        <div className="py-16 text-center">
          <p className="mb-4 text-muted-fg">No coverage yet.</p>
          <Link
            href="/policies"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background"
          >
            Browse Policies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-primary">My Coverage</h1>

      <div className="mb-6 flex gap-2">
        {(["all", "active", "settled", "expired", "cancelled"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                filter === s
                  ? "bg-primary text-background"
                  : "bg-secondary text-muted-fg hover:text-primary"
              }`}
            >
              {s}
            </button>
          ),
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((tokenId) => (
          <PolicyCard
            key={tokenId.toString()}
            tokenId={tokenId}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}

function PolicyCard({
  tokenId,
  filter,
}: {
  tokenId: bigint;
  filter: StatusFilter;
}) {
  const { data: policyData, isLoading: policyLoading } = usePolicyData(tokenId);

  const poolAddress = policyData ? (policyData as { pool: string }).pool : "";
  const { data: poolName } = usePoolName(poolAddress);

  if (policyLoading) {
    return (
      <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />
    );
  }

  if (!policyData) return null;

  const policy = policyData as {
    pool: string;
    holder: string;
    premium: bigint;
    coverage: bigint;
    purchaseTimestamp: bigint;
    expiryTimestamp: bigint;
    status: number;
    payoutAmount: bigint;
    eligibilityProofHash: string;
  };

  const statusStr = policyStatusToString(policy.status);

  // Filter check
  if (filter !== "all" && statusStr !== filter) return null;

  const purchasedDate = new Date(
    Number(policy.purchaseTimestamp) * 1000,
  ).toLocaleDateString();
  const expiryDate = new Date(
    Number(policy.expiryTimestamp) * 1000,
  ).toLocaleDateString();

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-dim">
          Token #{tokenId.toString()}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[statusStr] || "bg-dim/30 text-dim"}`}
        >
          {statusStr}
        </span>
      </div>
      <h3 className="mb-3 text-base font-semibold text-primary">
        {poolName || `Pool ${policy.pool.slice(0, 8)}...`}
      </h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-fg">Premium</span>
          <span className="font-mono text-primary">
            {formatCZUSD(policy.premium)} CZUSD
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-fg">Coverage</span>
          <span className="font-mono text-primary">
            {formatCZUSD(policy.coverage)} CZUSD
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-fg">Purchased</span>
          <span className="text-dim">{purchasedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-fg">Expires</span>
          <span className="text-dim">{expiryDate}</span>
        </div>
      </div>
    </div>
  );
}
