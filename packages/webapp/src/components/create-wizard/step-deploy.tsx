"use client";

import { useState } from "react";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import { useCreatePool } from "@/lib/hooks/use-contracts";
import { parseCZUSD } from "@/lib/czusd";
import { keccak256, toBytes } from "viem";
import { thirdwebClient } from "@/lib/thirdweb";

const avalancheFuji = defineChain(43113);

interface DeployConfig {
  premium: string;
  maxPayout: string;
  duration: string;
  minHolders: string;
  maxHolders: string;
}

interface StepDeployProps {
  config: DeployConfig;
  onChange: (config: DeployConfig) => void;
  onDeploy: () => void;
  summary: {
    sources: string[];
    consensusMethod: string;
    metric: string;
    comparison: string;
    threshold: string;
    verificationType: string;
  };
  eligibilityText: string;
  settlementText: string;
  verificationType: string;
  sources: string[];
  consensusMethod: string;
  triggerConfig: {
    metric: string;
    comparison: string;
    threshold: string;
    duration: string;
    cadence: string;
  };
}

function mapComparison(comp: string): number {
  switch (comp) {
    case "lt":
      return 0;
    case "gt":
      return 1;
    case "lte":
      return 2;
    case "gte":
      return 3;
    default:
      return 1;
  }
}

function mapConsensusMethod(method: string): number {
  switch (method) {
    case "median":
      return 0;
    case "majority":
    case "mode":
      return 1;
    default:
      return 0;
  }
}

function mapVerificationType(vt: string): number {
  switch (vt) {
    case "none":
      return 0;
    case "identity":
      return 1;
    case "flight":
      return 2;
    case "employment":
      return 3;
    case "property":
      return 4;
    default:
      return 0;
  }
}

function parseCadenceToSeconds(cadence: string): bigint {
  const match = cadence.match(/^(\d+)(m|h|d)$/);
  if (!match) return 300n;
  const value = Number(match[1]);
  switch (match[2]) {
    case "m":
      return BigInt(value * 60);
    case "h":
      return BigInt(value * 3600);
    case "d":
      return BigInt(value * 86400);
    default:
      return 300n;
  }
}

export default function StepDeploy({
  config,
  onChange,
  onDeploy,
  summary,
  eligibilityText,
  settlementText,
  verificationType,
  sources,
  consensusMethod,
  triggerConfig,
}: StepDeployProps) {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [error, setError] = useState("");

  const account = useActiveAccount();
  const { data: nativeBalance } = useWalletBalance({
    address: account?.address,
    chain: avalancheFuji,
    client: thirdwebClient!,
  });

  const insufficientGas =
    nativeBalance !== undefined && BigInt(nativeBalance.value) === 0n;
  const missingFields = !config.premium || !config.maxPayout;

  const { createPool, isPending } = useCreatePool();

  const update = (field: keyof DeployConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError("");
    setDeployStatus("Preparing transaction...");

    try {
      const name = `${triggerConfig.metric} ${triggerConfig.comparison.toUpperCase()} ${triggerConfig.threshold} Shield`;
      const description = `Parametric insurance pool: triggers when ${triggerConfig.metric} ${triggerConfig.comparison} ${triggerConfig.threshold}. Sources: ${sources.join(", ")}. Consensus: ${consensusMethod}. Verification: ${verificationType}.`;

      const poolConfig = {
        name,
        description,
        comparison: mapComparison(triggerConfig.comparison),
        triggerThreshold: BigInt(triggerConfig.threshold || "0"),
        duration: BigInt(triggerConfig.duration || "12"),
        consensusMethod: mapConsensusMethod(consensusMethod),
        verificationCadence: parseCadenceToSeconds(triggerConfig.cadence),
        eligibilityAgreementHash: keccak256(toBytes(eligibilityText || "none")),
        settlementAgreementHash: keccak256(toBytes(settlementText || "none")),
        eligibilityTldrHash: keccak256(
          toBytes((eligibilityText || "none").slice(0, 200)),
        ),
        settlementTldrHash: keccak256(
          toBytes((settlementText || "none").slice(0, 200)),
        ),
        verificationType: mapVerificationType(verificationType),
        premiumAmount: parseCZUSD(config.premium || "0"),
        maxPayoutPerPolicy: parseCZUSD(config.maxPayout || "0"),
        poolEndTimestamp: BigInt(
          Math.floor(Date.now() / 1000) +
            Number(config.duration || "30") * 86400,
        ),
        minPolicyholders: BigInt(config.minHolders || "1"),
        maxPolicyholders: BigInt(config.maxHolders || "100"),
      };

      setDeployStatus("Waiting for wallet confirmation...");
      const result = await createPool(poolConfig);
      const hash = result.transactionHash;
      setTxHash(hash);
      setDeployStatus("Transaction submitted. Waiting for confirmation...");

      // Activate pool via server-side API
      setDeployStatus("Activating pool...");
      try {
        const activateRes = await fetch("/api/activate-pool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash }),
        });
        const activateData = await activateRes.json();
        if (activateData.poolAddress) {
          setPoolAddress(activateData.poolAddress);
        }
      } catch {
        // Pool activation failed — pool is still created on-chain
      }

      setDeploying(false);
      setDeployed(true);
      setDeployStatus("Pool deployed successfully!");
      onDeploy();
    } catch (err: unknown) {
      setDeploying(false);
      const message = err instanceof Error ? err.message : "Deployment failed";
      setError(message);
      setDeployStatus("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-primary">Economics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted-fg">
              Premium (CZUSD)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={config.premium}
              onChange={(e) =>
                update("premium", e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="50"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-fg">
              Max Payout (CZUSD)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={config.maxPayout}
              onChange={(e) =>
                update("maxPayout", e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="5000"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-fg">
              Duration (days)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={config.duration}
              onChange={(e) =>
                update("duration", e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="30"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-fg">
              Max Holders
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={config.maxHolders}
              onChange={(e) =>
                update("maxHolders", e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="100"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-primary placeholder:text-dim outline-none focus:border-dim"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-primary">Summary</h3>
        <div className="space-y-2 rounded-lg bg-secondary p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-fg">Sources</span>
            <span className="text-primary">
              {summary.sources.join(", ") || "None selected"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-fg">Consensus</span>
            <span className="text-primary">{summary.consensusMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-fg">Trigger</span>
            <span className="font-mono text-primary">
              {summary.metric} {summary.comparison.toUpperCase()}{" "}
              {summary.threshold}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-fg">Verification</span>
            <span className="capitalize text-primary">
              {summary.verificationType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-fg">Premium</span>
            <span className="font-mono text-primary">
              {config.premium || "0"} CZUSD
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-fg">Max Payout</span>
            <span className="font-mono text-primary">
              {config.maxPayout || "0"} CZUSD
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
          <p className="font-medium">Deployment failed</p>
          <p className="mt-1 break-all text-xs">{error}</p>
        </div>
      )}

      {deployStatus && !error && (
        <div className="rounded-lg bg-blue-900/20 p-4 text-sm text-blue-400">
          {deployStatus}
        </div>
      )}

      {!account?.address && (
        <div className="rounded-lg bg-yellow-900/20 p-3 text-sm text-yellow-400">
          Connect your wallet to deploy the pool.
        </div>
      )}

      {account?.address && insufficientGas && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          Insufficient AVAX for gas fees. Fund your wallet with Fuji AVAX to
          deploy.
        </div>
      )}

      {missingFields && (
        <div className="rounded-lg bg-yellow-900/20 p-3 text-sm text-yellow-400">
          Premium and Max Payout are required to deploy.
        </div>
      )}

      {deployed ? (
        <div className="space-y-3 rounded-lg bg-green-900/20 p-4 text-sm text-green-400">
          <p className="text-center font-medium">
            Pool deployed successfully. Redirecting...
          </p>
          {txHash && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-fg">Tx Hash</span>
              <a
                href={`https://testnet.snowtrace.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-green-400 underline"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}
          {poolAddress && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-fg">Pool Address</span>
              <a
                href={`https://testnet.snowtrace.io/address/${poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-green-400 underline"
              >
                {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
              </a>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleDeploy}
          disabled={
            deploying ||
            isPending ||
            !account?.address ||
            insufficientGas ||
            missingFields
          }
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {deploying || isPending
            ? "Deploying Pool..."
            : "Deploy Insurance Pool"}
        </button>
      )}
    </div>
  );
}
