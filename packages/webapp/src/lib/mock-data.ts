export type PoolType = "crypto" | "stablecoin" | "weather" | "flight";
export type PoolStatus = "active" | "monitoring" | "triggered" | "settled";
export type VerificationType =
  | "none"
  | "identity"
  | "flight"
  | "employment"
  | "property";

export interface MonitoringPoint {
  time: string;
  value: number;
}

export interface MockPool {
  address: string;
  name: string;
  description: string;
  type: PoolType;
  status: PoolStatus;
  premium: string;
  maxPayout: string;
  participants: number;
  maxParticipants: number;
  verificationType: VerificationType;
  consensusMethod: string;
  triggerThreshold: number;
  comparison: "lt" | "gt" | "lte" | "gte";
  sources: string[];
  eligibilityAgreement: string;
  settlementAgreement: string;
  monitoringData: MonitoringPoint[];
}

function generateMonitoringData(
  baseValue: number,
  volatility: number,
  trend: number,
): MonitoringPoint[] {
  const data: MonitoringPoint[] = [];
  let value = baseValue;
  for (let i = 0; i < 24; i++) {
    value += (Math.random() - 0.5) * volatility + trend;
    data.push({
      time: `${i}:00`,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

export const MOCK_POOLS: MockPool[] = [
  {
    address: "0x1111111111111111111111111111111111111111",
    name: "Crypto Crash Shield",
    description:
      "Protection against sudden BTC price drops exceeding 20% within a 24-hour window. Automated trigger via multi-source price feed consensus.",
    type: "crypto",
    status: "active",
    premium: "50",
    maxPayout: "5000",
    participants: 23,
    maxParticipants: 100,
    verificationType: "none",
    consensusMethod: "median",
    triggerThreshold: 20,
    comparison: "gt",
    sources: ["CoinGecko API", "CryptoCompare API", "Chainlink Price Feed"],
    eligibilityAgreement: `ELIGIBILITY AGREEMENT — Crypto Crash Shield

1. COVERAGE SCOPE
This policy covers the holder against a decline in Bitcoin (BTC) price exceeding 20% within any rolling 24-hour period, as measured by the consensus of three independent data sources.

2. ELIGIBILITY
Any wallet holder on Avalanche Fuji may purchase this policy. No additional identity verification is required.

3. PREMIUM
The policyholder must pay 50 CZUSD to activate coverage. Premium is non-refundable once coverage begins.

4. EXCLUSIONS
- Gradual price decline over periods longer than 24 hours
- Price movements on exchanges not included in the data source list
- Events caused by network downtime or oracle failure`,
    settlementAgreement: `SETTLEMENT AGREEMENT — Crypto Crash Shield

1. TRIGGER CONDITION
A payout is triggered when the 24-hour BTC price change exceeds -20%, as determined by the median value across CoinGecko, CryptoCompare, and Chainlink Price Feed.

2. PAYOUT
Upon trigger, each active policyholder receives up to 5,000 CZUSD from the pool reserves, proportional to their coverage level.

3. VERIFICATION
The CRE workflow monitors BTC price every 5 minutes. Trigger detection requires consensus from at least 2 of 3 data sources.

4. SETTLEMENT TIMELINE
Payouts are executed automatically within one CRE tick cycle (~5 minutes) of trigger confirmation. No manual claims process.

5. DISPUTE RESOLUTION
Settlement is final and on-chain. The AI adjudicator reviews edge cases within the TEE before confirming trigger.`,
    monitoringData: generateMonitoringData(62000, 1500, -200),
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    name: "Stablecoin Depeg Guard",
    description:
      "Coverage for USDC depegging below $0.95 for more than 1 hour. Multi-exchange price monitoring with AI-enhanced verification.",
    type: "stablecoin",
    status: "monitoring",
    premium: "25",
    maxPayout: "2500",
    participants: 45,
    maxParticipants: 200,
    verificationType: "none",
    consensusMethod: "mode",
    triggerThreshold: 0.95,
    comparison: "lt",
    sources: ["Chainlink USDC/USD", "Coingecko USDC", "Uniswap TWAP"],
    eligibilityAgreement: `ELIGIBILITY AGREEMENT — Stablecoin Depeg Guard

1. COVERAGE SCOPE
This policy protects against USDC losing its dollar peg, defined as trading below $0.95 for a sustained period of 1 hour or more.

2. ELIGIBILITY
Open to all wallet holders. No KYC or identity verification required.

3. PREMIUM
25 CZUSD per policy period. Non-refundable after activation.

4. EXCLUSIONS
- Brief flash crashes lasting under 1 hour
- Depegging of stablecoins other than USDC
- Events on chains other than those monitored`,
    settlementAgreement: `SETTLEMENT AGREEMENT — Stablecoin Depeg Guard

1. TRIGGER CONDITION
Triggered when USDC trades below $0.95 for 60+ consecutive minutes across at least 2 of 3 monitored sources.

2. PAYOUT
Up to 2,500 CZUSD per policyholder upon trigger confirmation.

3. VERIFICATION
CRE monitors USDC price every 1 minute. Duration tracking begins when price first drops below threshold.

4. SETTLEMENT
Automatic payout within one tick cycle of duration confirmation. AI adjudicator validates the depeg event in TEE.`,
    monitoringData: generateMonitoringData(1.0, 0.005, -0.001),
  },
  {
    address: "0x3333333333333333333333333333333333333333",
    name: "Weather Drought Cover",
    description:
      "Agricultural drought protection triggered when regional rainfall drops below 50mm in any 30-day period. Satellite and weather station verification.",
    type: "weather",
    status: "active",
    premium: "75",
    maxPayout: "10000",
    participants: 12,
    maxParticipants: 50,
    verificationType: "property",
    consensusMethod: "median",
    triggerThreshold: 50,
    comparison: "lt",
    sources: ["OpenWeather API", "WeatherAPI.com", "NOAA Satellite Data"],
    eligibilityAgreement: `ELIGIBILITY AGREEMENT — Weather Drought Cover

1. COVERAGE SCOPE
Protection for agricultural operations affected by drought conditions, defined as cumulative rainfall below 50mm in any rolling 30-day period within the covered region.

2. ELIGIBILITY
Policyholders must verify property ownership or agricultural lease in the covered region. Verification conducted via secure enclave.

3. PREMIUM
75 CZUSD per coverage period. Premium reflects regional risk assessment.

4. EXCLUSIONS
- Properties outside the designated coverage region
- Irrigation-dependent operations (supplemental water available)
- Drought conditions existing at time of policy purchase`,
    settlementAgreement: `SETTLEMENT AGREEMENT — Weather Drought Cover

1. TRIGGER CONDITION
Triggered when 30-day cumulative rainfall in the covered region falls below 50mm, as verified by median consensus across OpenWeather, WeatherAPI, and NOAA satellite data.

2. PAYOUT
Up to 10,000 CZUSD per eligible policyholder.

3. VERIFICATION
CRE workflow queries weather APIs daily. Cumulative tracking resets on a rolling 30-day window.

4. SETTLEMENT
Payouts issued within 24 hours of trigger confirmation. AI adjudicator cross-references satellite imagery within TEE.`,
    monitoringData: generateMonitoringData(65, 8, -1.5),
  },
  {
    address: "0x4444444444444444444444444444444444444444",
    name: "Flight Delay Protector",
    description:
      "Instant compensation for flight delays exceeding 3 hours. Real-time flight tracking with multi-source verification.",
    type: "flight",
    status: "active",
    premium: "15",
    maxPayout: "500",
    participants: 89,
    maxParticipants: 500,
    verificationType: "flight",
    consensusMethod: "mode",
    triggerThreshold: 180,
    comparison: "gt",
    sources: ["FlightAware API", "AviationStack API", "ADS-B Exchange"],
    eligibilityAgreement: `ELIGIBILITY AGREEMENT — Flight Delay Protector

1. COVERAGE SCOPE
Coverage for individual flight delays exceeding 3 hours (180 minutes) from scheduled departure time.

2. ELIGIBILITY
Policyholder must provide a valid flight number and travel date. Verification occurs through secure enclave matching against airline booking data.

3. PREMIUM
15 CZUSD per flight covered. Must be purchased at least 24 hours before scheduled departure.

4. EXCLUSIONS
- Flights cancelled (covered under separate cancellation policy)
- Delays due to passenger-caused incidents
- Charter and private flights`,
    settlementAgreement: `SETTLEMENT AGREEMENT — Flight Delay Protector

1. TRIGGER CONDITION
Triggered when actual departure time exceeds scheduled departure by 180+ minutes, as confirmed by at least 2 of 3 flight tracking sources.

2. PAYOUT
500 CZUSD per triggered policy.

3. VERIFICATION
CRE workflow monitors flight status starting 2 hours before scheduled departure, checking every 5 minutes until departure or trigger confirmation.

4. SETTLEMENT
Automatic payout within 15 minutes of trigger confirmation. No claims paperwork required.`,
    monitoringData: generateMonitoringData(15, 30, 5),
  },
];

export function getPoolByAddress(address: string): MockPool | undefined {
  return MOCK_POOLS.find(
    (p) => p.address.toLowerCase() === address.toLowerCase(),
  );
}

export interface MockCoverage {
  tokenId: number;
  poolAddress: string;
  poolName: string;
  status: "active" | "settled" | "expired";
  premium: string;
  maxPayout: string;
  purchasedAt: string;
  expiresAt: string;
}

export const MOCK_COVERAGES: MockCoverage[] = [
  {
    tokenId: 1,
    poolAddress: "0x1111111111111111111111111111111111111111",
    poolName: "Crypto Crash Shield",
    status: "active",
    premium: "50",
    maxPayout: "5000",
    purchasedAt: "2026-02-20",
    expiresAt: "2026-03-20",
  },
  {
    tokenId: 2,
    poolAddress: "0x4444444444444444444444444444444444444444",
    poolName: "Flight Delay Protector",
    status: "settled",
    premium: "15",
    maxPayout: "500",
    purchasedAt: "2026-02-15",
    expiresAt: "2026-02-16",
  },
];
