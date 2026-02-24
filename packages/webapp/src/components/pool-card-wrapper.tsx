"use client";

import Link from "next/link";
import {
  usePoolName,
  usePoolDescription,
  usePoolStatus,
  usePoolVerificationType,
} from "@/lib/hooks/use-contracts";
import {
  derivePoolType,
  poolStateToString,
  verificationTypeToString,
} from "@/lib/types";
import { formatCZUSD } from "@/lib/czusd";
import type { PoolType } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stablecoin: "Stablecoin",
  weather: "Weather",
  flight: "Flight",
};

const STATUS_COLORS: Record<string, string> = {
  funding: "bg-blue-900/30 text-blue-400",
  active: "bg-green-900/30 text-green-400",
  settled: "bg-dim/30 text-dim",
  expired: "bg-dim/30 text-dim",
  paused: "bg-yellow-900/30 text-yellow-400",
};

// Generate seeded monitoring mini-bars based on pool address
function generateMiniBars(address: string): number[] {
  let seed = 0;
  for (let i = 0; i < address.length; i++) {
    seed = (seed * 31 + address.charCodeAt(i)) & 0xffffffff;
  }
  const bars: number[] = [];
  for (let i = 0; i < 12; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    bars.push(10 + (seed % 90));
  }
  return bars;
}

export default function PoolCardWrapper({
  poolAddress,
  search,
  typeFilter,
}: {
  poolAddress: string;
  search: string;
  typeFilter: string;
}) {
  const { data: name, isLoading: nameLoading } = usePoolName(poolAddress);
  const { data: description } = usePoolDescription(poolAddress);
  const { data: statusData, isLoading: statusLoading } =
    usePoolStatus(poolAddress);
  const { data: verificationType } = usePoolVerificationType(poolAddress);

  if (nameLoading || statusLoading) {
    return (
      <div className="block rounded-lg border border-border bg-card p-5 animate-pulse">
        <div className="mb-3 h-4 w-24 rounded bg-secondary" />
        <div className="mb-1 h-5 w-40 rounded bg-secondary" />
        <div className="mb-4 h-8 w-full rounded bg-secondary" />
        <div className="h-8 w-full rounded bg-secondary" />
      </div>
    );
  }

  if (!name || !statusData) return null;

  const poolName = name as string;
  const poolDescription = (description as string) || "";
  const poolType = derivePoolType(poolName);
  const state = poolStateToString(Number(statusData[0]));
  const policyholderCount = Number(statusData[3]);
  const maxPolicyholders = Number(statusData[4]);
  const premiumAmount = statusData[6] as bigint;
  const maxPayoutPerPolicy = statusData[7] as bigint;
  const vtString = verificationTypeToString(Number(verificationType ?? 0));

  // Apply search and type filter
  const matchesSearch =
    !search ||
    poolName.toLowerCase().includes(search.toLowerCase()) ||
    poolDescription.toLowerCase().includes(search.toLowerCase());
  const matchesType = typeFilter === "all" || poolType === typeFilter;

  if (!matchesSearch || !matchesType) return null;

  const bars = generateMiniBars(poolAddress);

  return (
    <Link
      href={`/policies/${poolAddress}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-dim"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-fg">
            {TYPE_LABELS[poolType] || poolType}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[state] || "bg-dim/30 text-dim"}`}
          >
            {state}
          </span>
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-primary">{poolName}</h3>
      <p className="mb-4 line-clamp-2 text-sm text-muted-fg">
        {poolDescription}
      </p>
      <div className="mb-3 h-8 w-full overflow-hidden rounded bg-secondary">
        <div
          className="flex h-full items-end gap-px"
          style={{ padding: "2px" }}
        >
          {bars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-dim/50"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-fg">Premium: </span>
          <span className="font-mono text-primary">
            {formatCZUSD(premiumAmount)} CZUSD
          </span>
        </div>
        <div>
          <span className="text-muted-fg">Max: </span>
          <span className="font-mono text-primary">
            {formatCZUSD(maxPayoutPerPolicy)} CZUSD
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-dim">
        <span>
          {policyholderCount}/{maxPolicyholders} participants
        </span>
        <span>{vtString} verification</span>
      </div>
    </Link>
  );
}
