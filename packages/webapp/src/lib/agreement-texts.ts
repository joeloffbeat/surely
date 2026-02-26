// Agreement text mapping: keccak256 hash → full agreement text
// On-chain we store hashes only; demo needs full text for display

const AGREEMENT_TEXTS: Record<string, string> = {
  // Crypto Crash Shield
  "0xf0a9a77364a4d7605ec68cc3f0a183d08eb48391b5d2f6cf477c688c06158282": `ELIGIBILITY AGREEMENT — Crypto Crash Shield

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

  "0xe758d49bee6c50e2c4eba7b0bf124b3416ce5be028569435e448f799864da43c": `SETTLEMENT AGREEMENT — Crypto Crash Shield

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

  // Stablecoin Depeg Guard
  "0x5e3ec1cce5252440769bf325b840fc957a8d7723503988286b5ba77e5c3101e5": `ELIGIBILITY AGREEMENT — Stablecoin Depeg Guard

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

  "0xaeebb98e7a30575b61404e1076a75cdccd3039b665f6e64201c61d94f91dd63a": `SETTLEMENT AGREEMENT — Stablecoin Depeg Guard

1. TRIGGER CONDITION
Triggered when USDC trades below $0.95 for 60+ consecutive minutes across at least 2 of 3 monitored sources.

2. PAYOUT
Up to 2,500 CZUSD per policyholder upon trigger confirmation.

3. VERIFICATION
CRE monitors USDC price every 1 minute. Duration tracking begins when price first drops below threshold.

4. SETTLEMENT
Automatic payout within one tick cycle of duration confirmation. AI adjudicator validates the depeg event in TEE.`,

  // Weather Drought Cover
  "0x2e6d0747b60c623570b26e87608f8f69011f0d4dcc55cc70c2d8e3dbeb2bbcb7": `ELIGIBILITY AGREEMENT — Weather Drought Cover

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

  "0x25744fbd5e72292722d0d8be427422c9b484ab7a169842f05f9ab90c0a33b77f": `SETTLEMENT AGREEMENT — Weather Drought Cover

1. TRIGGER CONDITION
Triggered when 30-day cumulative rainfall in the covered region falls below 50mm, as verified by median consensus across OpenWeather, WeatherAPI, and NOAA satellite data.

2. PAYOUT
Up to 10,000 CZUSD per eligible policyholder.

3. VERIFICATION
CRE workflow queries weather APIs daily. Cumulative tracking resets on a rolling 30-day window.

4. SETTLEMENT
Payouts issued within 24 hours of trigger confirmation. AI adjudicator cross-references satellite imagery within TEE.`,

  // Flight Delay Protector
  "0x0fceb6ade4c33a34479f09e7eaa5fe46ec6d8f780f7892307df1f6cd12546a84": `ELIGIBILITY AGREEMENT — Flight Delay Protector

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

  "0x5c0ecfa8639d1519811cf541d4eaa0abd40f38e29f86150f29b3c2046cfa3858": `SETTLEMENT AGREEMENT — Flight Delay Protector

1. TRIGGER CONDITION
Triggered when actual departure time exceeds scheduled departure by 180+ minutes, as confirmed by at least 2 of 3 flight tracking sources.

2. PAYOUT
500 CZUSD per triggered policy.

3. VERIFICATION
CRE workflow monitors flight status starting 2 hours before scheduled departure, checking every 5 minutes until departure or trigger confirmation.

4. SETTLEMENT
Automatic payout within 15 minutes of trigger confirmation. No claims paperwork required.`,
};

// Data sources per pool (keyed by eligibility agreement hash)
const POOL_SOURCES: Record<string, string[]> = {
  "0xf0a9a77364a4d7605ec68cc3f0a183d08eb48391b5d2f6cf477c688c06158282": [
    "CoinGecko API",
    "CryptoCompare API",
    "Chainlink Price Feed",
  ],
  "0x5e3ec1cce5252440769bf325b840fc957a8d7723503988286b5ba77e5c3101e5": [
    "Chainlink USDC/USD",
    "Coingecko USDC",
    "Uniswap TWAP",
  ],
  "0x2e6d0747b60c623570b26e87608f8f69011f0d4dcc55cc70c2d8e3dbeb2bbcb7": [
    "OpenWeather API",
    "WeatherAPI.com",
    "NOAA Satellite Data",
  ],
  "0x0fceb6ade4c33a34479f09e7eaa5fe46ec6d8f780f7892307df1f6cd12546a84": [
    "FlightAware API",
    "AviationStack API",
    "ADS-B Exchange",
  ],
};

export function getAgreementText(hash: string): string {
  return AGREEMENT_TEXTS[hash.toLowerCase()] ?? AGREEMENT_TEXTS[hash] ?? "";
}

export function getPoolSources(eligibilityHash: string): string[] {
  return (
    POOL_SOURCES[eligibilityHash.toLowerCase()] ??
    POOL_SOURCES[eligibilityHash] ??
    []
  );
}
