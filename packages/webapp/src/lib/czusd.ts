export const CZUSD_DECIMALS = 6;

export function formatCZUSD(amount: bigint): string {
  const divisor = 10n ** BigInt(CZUSD_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction
    .toString()
    .padStart(CZUSD_DECIMALS, "0")
    .slice(0, 2);
  return `${whole}.${fractionStr}`;
}

export function parseCZUSD(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction
    .padEnd(CZUSD_DECIMALS, "0")
    .slice(0, CZUSD_DECIMALS);
  return BigInt(whole) * 10n ** BigInt(CZUSD_DECIMALS) + BigInt(paddedFraction);
}
