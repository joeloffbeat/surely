"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AgreementViewer from "@/components/agreement-viewer";
import MonitoringChart from "@/components/monitoring-chart";
import AiAdvisor from "@/components/ai-advisor";
import {
  usePoolName,
  usePoolDescription,
  usePoolStatus,
  usePoolComparison,
  usePoolTriggerThreshold,
  usePoolConsensusMethod,
  usePoolAgreements,
  usePoolVerificationType,
} from "@/lib/hooks/use-contracts";
import {
  derivePoolType,
  poolStateToString,
  comparisonToString,
  consensusMethodToString,
  verificationTypeToString,
} from "@/lib/types";
import type { PoolType } from "@/lib/types";
import { formatCZUSD } from "@/lib/czusd";
import { getAgreementText, getPoolSources } from "@/lib/agreement-texts";

interface MonitoringPoint {
  time: string;
  value: number;
}

const POOL_TYPE_SOURCE: Record<PoolType, string> = {
  crypto: "CoinGecko API",
  stablecoin: "CoinGecko API",
  weather: "OpenWeather API",
  flight: "FlightAware API",
};

function generateMonitoringData(
  poolType: PoolType,
  realBaseline?: number,
): MonitoringPoint[] {
  const configs: Record<
    PoolType,
    { baseValue: number; volatility: number; trend: number }
  > = {
    crypto: { baseValue: 62000, volatility: 1500, trend: -200 },
    stablecoin: { baseValue: 1.0, volatility: 0.005, trend: -0.001 },
    weather: { baseValue: 65, volatility: 8, trend: -1.5 },
    flight: { baseValue: 15, volatility: 30, trend: 5 },
  };
  const config = configs[poolType];
  const base = realBaseline ?? config.baseValue;
  const data: MonitoringPoint[] = [];
  let value = base;
  for (let i = 0; i < 24; i++) {
    value += (Math.random() - 0.5) * config.volatility + config.trend;
    data.push({
      time: `${i}:00`,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

export default function PolicyDetailClient({
  poolAddress,
}: {
  poolAddress: string;
}) {
  const [realBaseline, setRealBaseline] = useState<number | undefined>();

  const { data: name, isLoading: nameLoading } = usePoolName(poolAddress);
  const { data: description } = usePoolDescription(poolAddress);
  const { data: statusData, isLoading: statusLoading } =
    usePoolStatus(poolAddress);
  const { data: comparison } = usePoolComparison(poolAddress);
  const { data: triggerThreshold } = usePoolTriggerThreshold(poolAddress);
  const { data: consensusMethod } = usePoolConsensusMethod(poolAddress);
  const { data: agreements } = usePoolAgreements(poolAddress);
  const { data: verificationType } = usePoolVerificationType(poolAddress);

  if (nameLoading || statusLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-dim" />
          <span className="text-muted-fg">Loading pool details...</span>
        </div>
      </div>
    );
  }

  if (!name || !statusData) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="py-16 text-center text-muted-fg">
          Pool not found or unable to load data.
        </div>
      </div>
    );
  }

  const poolName = name as string;
  const poolDescription = (description as string) || "";
  const poolType = derivePoolType(poolName);
  const state = poolStateToString(Number(statusData[0]));
  const policyholderCount = Number(statusData[3]);
  const maxPolicyholders = Number(statusData[4]);
  const premiumAmount = statusData[6] as bigint;
  const maxPayoutPerPolicy = statusData[7] as bigint;
  const poolFull = policyholderCount >= maxPolicyholders;
  const poolNotActive = state !== "active";

  const comparisonStr = comparisonToString(Number(comparison ?? 0));
  const thresholdNum = Number(triggerThreshold ?? 0n);
  const consensusStr = consensusMethodToString(Number(consensusMethod ?? 0));
  const vtStr = verificationTypeToString(Number(verificationType ?? 0));

  // Get agreement texts from hashes
  const eligibilityHash = agreements?.[0] as string | undefined;
  const settlementHash = agreements?.[1] as string | undefined;
  const eligibilityText = eligibilityHash
    ? getAgreementText(eligibilityHash)
    : "";
  const settlementText = settlementHash ? getAgreementText(settlementHash) : "";
  const sources = eligibilityHash ? getPoolSources(eligibilityHash) : [];

  // Fetch real baseline value from data source
  useEffect(() => {
    const source = POOL_TYPE_SOURCE[poolType];
    if (!source) return;
    fetch("/api/test-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          const d = result.data;
          const val =
            d.btc?.price ?? d.rainfall_mm ?? d.delay_minutes ?? undefined;
          if (val != null) setRealBaseline(Number(val));
        }
      })
      .catch(() => {});
  }, [poolType]);

  // Generate monitoring data based on pool type with real baseline
  const monitoringData = generateMonitoringData(poolType, realBaseline);

  const premiumFormatted = formatCZUSD(premiumAmount);
  const maxPayoutFormatted = formatCZUSD(maxPayoutPerPolicy);

  const policyContext = `Policy: ${poolName}\nType: ${poolType}\nPremium: ${premiumFormatted} CZUSD\nMax Payout: ${maxPayoutFormatted} CZUSD\nTrigger: ${comparisonStr.toUpperCase()} ${thresholdNum}\nSources: ${sources.join(", ")}\n\nEligibility Agreement:\n${eligibilityText}\n\nSettlement Agreement:\n${settlementText}`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-primary">{poolName}</h1>
          <p className="text-sm text-muted-fg">{poolDescription}</p>
        </div>
        {poolFull ? (
          <span className="shrink-0 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-dim">
            Pool Full
          </span>
        ) : poolNotActive ? (
          <span className="shrink-0 rounded-lg bg-secondary px-4 py-2 text-sm font-medium capitalize text-dim">
            {state}
          </span>
        ) : (
          <Link
            href={`/policies/${poolAddress}/acquire`}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Acquire Coverage
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <span className="rounded bg-secondary px-3 py-1 text-sm text-muted-fg">
          Premium:{" "}
          <span className="font-mono text-primary">
            {premiumFormatted} CZUSD
          </span>
        </span>
        <span className="rounded bg-secondary px-3 py-1 text-sm text-muted-fg">
          Max Payout:{" "}
          <span className="font-mono text-primary">
            {maxPayoutFormatted} CZUSD
          </span>
        </span>
        <span className="rounded bg-secondary px-3 py-1 text-sm text-muted-fg">
          Participants:{" "}
          <span className="text-primary">
            {policyholderCount}/{maxPolicyholders}
          </span>
        </span>
        <span className="rounded bg-secondary px-3 py-1 text-sm text-muted-fg">
          Consensus: <span className="text-primary">{consensusStr}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MonitoringChart
            data={monitoringData}
            threshold={thresholdNum}
            comparison={comparisonStr as "lt" | "gt" | "lte" | "gte"}
          />
          <AgreementViewer
            eligibilityAgreement={eligibilityText}
            settlementAgreement={settlementText}
            sources={sources}
          />
        </div>
        <div className="h-[600px]">
          <AiAdvisor policyContext={policyContext} />
        </div>
      </div>
    </div>
  );
}
