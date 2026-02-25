"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, Loader2 } from "lucide-react";
import { useAllPools } from "@/lib/hooks/use-contracts";
import PoolCardWrapper from "@/components/pool-card-wrapper";
import PoolTableWrapper from "@/components/pool-table-wrapper";

export default function PoliciesClient() {
  const { data: poolAddresses, isLoading, error } = useAllPools();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-dim" />
          <span className="text-muted-fg">Loading pools from chain...</span>
        </div>
      </div>
    );
  }

  if (error || !poolAddresses) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="py-16 text-center text-muted-fg">
          Failed to load insurance pools. Please check your connection and try
          again.
        </div>
      </div>
    );
  }

  if (poolAddresses.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            Insurance Policies
          </h1>
          <Link
            href="/create"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Create Policy
          </Link>
        </div>
        <div className="py-16 text-center text-muted-fg">
          No insurance pools found on-chain.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Insurance Policies</h1>
        <Link
          href="/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Create Policy
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            size={16}
          />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-fg outline-none"
          >
            <option value="all">All Types</option>
            <option value="crypto">Crypto</option>
            <option value="stablecoin">Stablecoin</option>
            <option value="weather">Weather</option>
            <option value="flight">Flight</option>
          </select>
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-secondary text-primary" : "text-dim"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-2 ${view === "table" ? "bg-secondary text-primary" : "text-dim"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(poolAddresses as readonly string[]).map((addr) => (
            <PoolCardWrapper
              key={addr}
              poolAddress={addr}
              search={search}
              typeFilter={typeFilter}
            />
          ))}
        </div>
      ) : (
        <PoolTableWrapper
          poolAddresses={poolAddresses as readonly string[]}
          search={search}
          typeFilter={typeFilter}
        />
      )}
    </div>
  );
}
