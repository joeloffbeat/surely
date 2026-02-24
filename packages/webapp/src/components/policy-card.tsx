"use client";

import Link from "next/link";
import type { MockPool } from "@/lib/mock-data";

const TYPE_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stablecoin: "Stablecoin",
  weather: "Weather",
  flight: "Flight",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-900/30 text-green-400",
  monitoring: "bg-yellow-900/30 text-yellow-400",
  triggered: "bg-red-900/30 text-red-400",
  settled: "bg-dim/30 text-dim",
};

export default function PolicyCard({ pool }: { pool: MockPool }) {
  return (
    <Link
      href={`/policies/${pool.address}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-dim"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-fg">
            {TYPE_LABELS[pool.type] || pool.type}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[pool.status]}`}
          >
            {pool.status}
          </span>
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-primary">{pool.name}</h3>
      <p className="mb-4 line-clamp-2 text-sm text-muted-fg">
        {pool.description}
      </p>
      <div className="mb-3 h-8 w-full overflow-hidden rounded bg-secondary">
        <div
          className="flex h-full items-end gap-px"
          style={{ padding: "2px" }}
        >
          {pool.monitoringData.slice(-12).map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-dim/50"
              style={{
                height: `${Math.max(10, ((d.value - Math.min(...pool.monitoringData.slice(-12).map((p) => p.value))) / (Math.max(...pool.monitoringData.slice(-12).map((p) => p.value)) - Math.min(...pool.monitoringData.slice(-12).map((p) => p.value)) || 1)) * 100)}%`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-fg">Premium: </span>
          <span className="font-mono text-primary">{pool.premium} CZUSD</span>
        </div>
        <div>
          <span className="text-muted-fg">Max: </span>
          <span className="font-mono text-primary">{pool.maxPayout} CZUSD</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-dim">
        <span>
          {pool.participants}/{pool.maxParticipants} participants
        </span>
        <span>{pool.verificationType} verification</span>
      </div>
    </Link>
  );
}
