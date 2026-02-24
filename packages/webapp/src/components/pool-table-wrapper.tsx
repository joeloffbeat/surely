"use client";

import { useRouter } from "next/navigation";
import {
  usePoolName,
  usePoolDescription,
  usePoolStatus,
} from "@/lib/hooks/use-contracts";
import { derivePoolType, poolStateToString } from "@/lib/types";
import { formatCZUSD } from "@/lib/czusd";

const STATUS_COLORS: Record<string, string> = {
  funding: "text-blue-400",
  active: "text-green-400",
  settled: "text-dim",
  expired: "text-dim",
  paused: "text-yellow-400",
};

function PoolTableRow({
  poolAddress,
  search,
  typeFilter,
}: {
  poolAddress: string;
  search: string;
  typeFilter: string;
}) {
  const router = useRouter();
  const { data: name } = usePoolName(poolAddress);
  const { data: description } = usePoolDescription(poolAddress);
  const { data: statusData } = usePoolStatus(poolAddress);

  if (!name || !statusData) return null;

  const poolName = name as string;
  const poolDescription = (description as string) || "";
  const poolType = derivePoolType(poolName);
  const state = poolStateToString(Number(statusData[0]));
  const policyholderCount = Number(statusData[3]);
  const maxPolicyholders = Number(statusData[4]);
  const premiumAmount = statusData[6] as bigint;
  const maxPayoutPerPolicy = statusData[7] as bigint;

  const matchesSearch =
    !search ||
    poolName.toLowerCase().includes(search.toLowerCase()) ||
    poolDescription.toLowerCase().includes(search.toLowerCase());
  const matchesType = typeFilter === "all" || poolType === typeFilter;

  if (!matchesSearch || !matchesType) return null;

  return (
    <tr
      onClick={() => router.push(`/policies/${poolAddress}`)}
      className="cursor-pointer border-b border-border transition-colors hover:bg-card"
    >
      <td className="px-4 py-3 font-medium text-primary">{poolName}</td>
      <td className="px-4 py-3 capitalize text-muted-fg">{poolType}</td>
      <td className="px-4 py-3 font-mono">
        {formatCZUSD(premiumAmount)} CZUSD
      </td>
      <td className="px-4 py-3 font-mono">
        {formatCZUSD(maxPayoutPerPolicy)} CZUSD
      </td>
      <td className="px-4 py-3 text-muted-fg">
        {policyholderCount}/{maxPolicyholders}
      </td>
      <td
        className={`px-4 py-3 capitalize ${STATUS_COLORS[state] || "text-dim"}`}
      >
        {state}
      </td>
    </tr>
  );
}

export default function PoolTableWrapper({
  poolAddresses,
  search,
  typeFilter,
}: {
  poolAddresses: readonly string[];
  search: string;
  typeFilter: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left text-muted-fg">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Premium</th>
            <th className="px-4 py-3 font-medium">Coverage</th>
            <th className="px-4 py-3 font-medium">Participants</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {poolAddresses.map((addr) => (
            <PoolTableRow
              key={addr}
              poolAddress={addr}
              search={search}
              typeFilter={typeFilter}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
