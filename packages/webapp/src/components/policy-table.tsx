"use client";

import { useRouter } from "next/navigation";
import type { MockPool } from "@/lib/mock-data";

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400",
  monitoring: "text-yellow-400",
  triggered: "text-red-400",
  settled: "text-dim",
};

export default function PolicyTable({ pools }: { pools: MockPool[] }) {
  const router = useRouter();

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
          {pools.map((pool) => (
            <tr
              key={pool.address}
              onClick={() => router.push(`/policies/${pool.address}`)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-card"
            >
              <td className="px-4 py-3 font-medium text-primary">
                {pool.name}
              </td>
              <td className="px-4 py-3 capitalize text-muted-fg">
                {pool.type}
              </td>
              <td className="px-4 py-3 font-mono">{pool.premium} CZUSD</td>
              <td className="px-4 py-3 font-mono">{pool.maxPayout} CZUSD</td>
              <td className="px-4 py-3 text-muted-fg">
                {pool.participants}/{pool.maxParticipants}
              </td>
              <td
                className={`px-4 py-3 capitalize ${STATUS_COLORS[pool.status]}`}
              >
                {pool.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
