"use client";

import { useActiveAccount } from "thirdweb/react";
import { useCZUSDBalance } from "@/lib/hooks/use-contracts";
import { formatCZUSD } from "@/lib/czusd";

export default function CzusdConverter() {
  const account = useActiveAccount();
  const { data: balance, isLoading } = useCZUSDBalance(account?.address);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-primary">CZUSD Info</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-fg">Conversion Rate</span>
          <span className="font-mono text-primary">1 USD = 1 CZUSD</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-fg">Your Balance</span>
          <span className="font-mono text-primary">
            {!account?.address
              ? "Connect wallet"
              : isLoading
                ? "Loading..."
                : `${formatCZUSD(balance ?? 0n)} CZUSD`}
          </span>
        </div>
        <p className="mt-2 text-xs text-dim">
          CZUSD is the protocol stablecoin used for premiums and payouts.
        </p>
      </div>
    </div>
  );
}
