"use client";

import { useState } from "react";

const AVAILABLE_SOURCES = [
  "CoinGecko API",
  "CryptoCompare API",
  "Chainlink Price Feed",
  "OpenWeather API",
  "WeatherAPI.com",
  "NOAA Satellite Data",
  "FlightAware API",
  "AviationStack API",
  "ADS-B Exchange",
  "Uniswap TWAP",
];

const CONSENSUS_METHODS = [
  {
    value: "median",
    label: "Median",
    desc: "Middle value from sorted responses",
  },
  { value: "mode", label: "Mode", desc: "Most common value across sources" },
  { value: "mean", label: "Mean", desc: "Average of all responses" },
];

interface StepSourcesProps {
  sources: string[];
  consensusMethod: string;
  onChange: (sources: string[], consensus: string) => void;
}

export default function StepSources({
  sources,
  consensusMethod,
  onChange,
}: StepSourcesProps) {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<
      string,
      { success: boolean; value?: string; latency?: number; error?: string }
    >
  >({});

  const toggleSource = (source: string) => {
    const next = sources.includes(source)
      ? sources.filter((s) => s !== source)
      : [...sources, source];
    onChange(next, consensusMethod);
  };

  const testSource = async (source: string) => {
    setTesting(source);
    try {
      const res = await fetch("/api/test-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const result = await res.json();
      if (result.success) {
        const data = result.data;
        const value =
          data.btc?.price != null
            ? `BTC $${Number(data.btc.price).toLocaleString()}`
            : data.rainfall_mm != null
              ? `${data.rainfall_mm}mm rainfall`
              : data.delay_minutes != null
                ? `${data.delay_minutes}min delay`
                : JSON.stringify(data).slice(0, 60);
        setTestResults((prev) => ({
          ...prev,
          [source]: { success: true, value, latency: result.latency },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [source]: { success: false, error: result.error },
        }));
      }
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [source]: { success: false, error: "Network error" },
      }));
    }
    setTesting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-primary">Data Sources</h3>
        <p className="mb-3 text-xs text-dim">
          Select 2-3 sources for trigger verification
        </p>
        <div className="space-y-2">
          {AVAILABLE_SOURCES.map((source) => (
            <div
              key={source}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                sources.includes(source)
                  ? "border-primary bg-secondary"
                  : "border-border bg-card"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  className="accent-primary"
                />
                <span className="text-sm text-primary">{source}</span>
              </label>
              <div className="flex items-center gap-2">
                {testResults[source] && (
                  <span
                    className={`text-xs ${testResults[source].success ? "text-green-500" : "text-red-500"}`}
                  >
                    {testResults[source].success
                      ? `${testResults[source].value} (${testResults[source].latency}ms)`
                      : testResults[source].error}
                  </span>
                )}
                <button
                  onClick={() => testSource(source)}
                  disabled={testing === source}
                  className="rounded bg-muted px-2 py-1 text-xs text-muted-fg transition-colors hover:text-primary"
                >
                  {testing === source ? "Testing..." : "Test"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-primary">
          Consensus Method
        </h3>
        <div className="space-y-2">
          {CONSENSUS_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                consensusMethod === method.value
                  ? "border-primary bg-secondary"
                  : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name="consensus"
                value={method.value}
                checked={consensusMethod === method.value}
                onChange={() => onChange(sources, method.value)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <div className="text-sm font-medium text-primary">
                  {method.label}
                </div>
                <div className="text-xs text-dim">{method.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
