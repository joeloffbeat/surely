export enum PoolState {
  FUNDING = 0,
  ACTIVE = 1,
  SETTLED = 2,
  EXPIRED = 3,
  PAUSED = 4,
}

export enum PolicyStatus {
  ACTIVE = 0,
  SETTLED = 1,
  EXPIRED = 2,
  CANCELLED = 3,
}

export enum VerificationTypeEnum {
  NONE = 0,
  IDENTITY = 1,
  FLIGHT = 2,
  EMPLOYMENT = 3,
  PROPERTY = 4,
}

export interface OnChainPool {
  address: string;
  name: string;
  description: string;
  state: PoolState;
  comparison: number; // 0=LT, 1=GT, 2=LTE, 3=GTE
  triggerThreshold: bigint;
  duration: bigint;
  consensusMethod: number; // 0=byMedian, 1=byMajority
  verificationCadence: bigint;
  verificationType: number;
  premiumAmount: bigint;
  maxPayoutPerPolicy: bigint;
  poolEndTimestamp: bigint;
  minPolicyholders: bigint;
  maxPolicyholders: bigint;
  totalUnderwritten: bigint;
  totalPremiums: bigint;
  policyholderCount: bigint;
  eligibilityAgreementHash: string;
  settlementAgreementHash: string;
}

export interface OnChainPolicy {
  pool: string;
  holder: string;
  premium: bigint;
  coverage: bigint;
  purchaseTimestamp: bigint;
  expiryTimestamp: bigint;
  status: PolicyStatus;
  payoutAmount: bigint;
  eligibilityProofHash: string;
}

export type PoolType = "crypto" | "stablecoin" | "weather" | "flight";

export function derivePoolType(name: string): PoolType {
  const lower = name.toLowerCase();
  if (lower.includes("crypto") || lower.includes("btc")) return "crypto";
  if (
    lower.includes("stablecoin") ||
    lower.includes("depeg") ||
    lower.includes("usdc")
  )
    return "stablecoin";
  if (
    lower.includes("weather") ||
    lower.includes("drought") ||
    lower.includes("rain")
  )
    return "weather";
  if (lower.includes("flight") || lower.includes("delay")) return "flight";
  return "crypto";
}

export function poolStateToString(state: PoolState): string {
  switch (state) {
    case PoolState.FUNDING:
      return "funding";
    case PoolState.ACTIVE:
      return "active";
    case PoolState.SETTLED:
      return "settled";
    case PoolState.EXPIRED:
      return "expired";
    case PoolState.PAUSED:
      return "paused";
    default:
      return "unknown";
  }
}

export function policyStatusToString(status: PolicyStatus): string {
  switch (status) {
    case PolicyStatus.ACTIVE:
      return "active";
    case PolicyStatus.SETTLED:
      return "settled";
    case PolicyStatus.EXPIRED:
      return "expired";
    case PolicyStatus.CANCELLED:
      return "cancelled";
    default:
      return "unknown";
  }
}

export function comparisonToString(comparison: number): string {
  switch (comparison) {
    case 0:
      return "lt";
    case 1:
      return "gt";
    case 2:
      return "lte";
    case 3:
      return "gte";
    default:
      return "gt";
  }
}

export function consensusMethodToString(method: number): string {
  return method === 0 ? "median" : "mode";
}

export function verificationTypeToString(vt: number): string {
  switch (vt) {
    case 0:
      return "none";
    case 1:
      return "identity";
    case 2:
      return "flight";
    case 3:
      return "employment";
    case 4:
      return "property";
    default:
      return "none";
  }
}
