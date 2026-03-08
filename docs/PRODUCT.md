# Surely -- Parametric Insurance Protocol on CRE

**Hackathon:** Chainlink Convergence + Avalanche Build Games (dual submission)
**Tracks:** DeFi + AI + Real-World Data (multi-track submission)
**Tagline:** Parametric insurance that pays instantly when real-world triggers fire -- no claims, no adjusters, no waiting. Powered by CRE workflows, multi-source data verification, and AI adjudication.

---

## Table of Contents

1. [Product Overview and Problem Statement](#1-product-overview-and-problem-statement)
2. [Core Features](#2-core-features)
3. [Insurance Pool Types](#3-insurance-pool-types)
4. [Full CRE Architecture](#4-full-cre-architecture)
5. [Smart Contracts](#5-smart-contracts)
6. [ACE Compliance Policies](#6-ace-compliance-policies)
7. [Frontend Pages](#7-frontend-pages)
8. [External Integrations](#8-external-integrations)
9. [Hackathon Demo Flow](#9-hackathon-demo-flow)
10. [Business Model](#10-business-model)
11. [Technical Hackathon Scope](#11-technical-hackathon-scope)
12. [Tracks and Prizes](#12-tracks-and-prizes)

---

## 1. Product Overview and Problem Statement

### The Insurance Industry is Broken

The global insurance industry collects $6.3 trillion in annual premiums. It is one of the oldest and most profitable industries on earth. It is also one of the most adversarial, opaque, and inefficient.

**The structural problems:**

| Problem | Impact | Scale |
|---------|--------|-------|
| **Excessive Overhead** | 40-60% of every premium dollar goes to administration, adjusters, legal, fraud investigation, and executive compensation. The policyholder receives less than half of what they pay. | US property/casualty insurers spent $0.58 of every premium dollar on non-claim expenses in 2023 (NAIC). |
| **Adversarial Claims Process** | The insurer's financial incentive is to deny or minimize claims. Policyholders must prove their loss against a well-funded opponent. Disputes are common, outcomes are unpredictable. | 1 in 5 homeowner claims are initially denied (National Association of Insurance Commissioners). Average time to resolve a disputed claim: 18 months. |
| **Slow Payouts** | Even uncontested claims take weeks to months. Policyholders who suffer a loss -- crop failure, property damage, flight disruption -- must wait while adjusters investigate, paperwork circulates, and approvals chain through bureaucracy. | Average US home insurance claim takes 30-45 days to settle. Crop insurance claims average 60-90 days. Disaster-related claims can exceed 12 months. |
| **Fraud Tax** | Insurance fraud costs the industry $80 billion annually. Every policyholder pays for it through higher premiums. Fraud investigation adds another layer of delay and adversarialism to legitimate claims. | The Coalition Against Insurance Fraud estimates fraud adds $400-700 per year to the average US household's premium costs. |
| **Coverage Gaps** | Traditional insurance requires detailed assessment of individual risk. This makes it uneconomical to insure many real-world risks: smallholder farmers, gig workers, emerging markets, micro-events. | Less than 3% of natural disaster losses in developing countries are insured (Swiss Re). 50% of US small businesses have no business interruption insurance. |
| **Moral Hazard and Adverse Selection** | Insured parties may take on more risk (moral hazard) or only the riskiest actors buy insurance (adverse selection). Both distort pricing and reduce market efficiency. | Flood insurance in the US is chronically underpriced because only flood-prone homeowners buy it. The NFIP is $20.5 billion in debt to the US Treasury. |

### What is Parametric Insurance

Parametric insurance is a fundamentally different model. Instead of indemnifying a policyholder for their actual loss (which requires investigation, adjustment, and subjective assessment), parametric insurance pays a predetermined amount when a measurable, objective trigger condition is met.

**The key differences:**

| Dimension | Traditional Insurance | Parametric Insurance |
|-----------|----------------------|---------------------|
| **Trigger** | Policyholder files a claim, adjuster investigates actual loss | Objective data threshold is crossed (e.g., rainfall < 50mm in 30 days) |
| **Assessment** | Subjective -- adjuster estimates damage, disputes are common | Objective -- data either meets the threshold or it does not |
| **Payout timing** | Weeks to months after claim filing | Immediate upon trigger verification |
| **Overhead** | 40-60% of premiums | Can be as low as 5-15% with automation |
| **Fraud risk** | High -- incentive to exaggerate or fabricate losses | Near zero -- trigger is based on external data, not policyholder reporting |
| **Coverage gaps** | Cannot economically cover many risks (too expensive to assess) | Can cover any risk that has a measurable data source |
| **Dispute rate** | 15-25% of claims disputed | Near zero -- the trigger is binary and verifiable |

**The market is massive and growing:**

- The global parametric insurance market is projected to exceed $100 billion by 2030 (Allied Market Research).
- Year-over-year growth exceeds 20% as climate risk, digital infrastructure, and DeFi create new insurable events.
- The World Bank, ADB, and CARICOM have deployed parametric insurance for sovereign disaster risk since 2007 (Caribbean Catastrophe Risk Insurance Facility).
- Agricultural parametric products are active in 40+ countries, insuring over 300 million smallholder farmers.

### Why Parametric Insurance Has Not Scaled

Despite the clear advantages, parametric insurance remains a niche product (less than 5% of the global insurance market). Three unsolved problems prevent it from scaling:

1. **Oracle problem.** Who decides if the trigger was met? Traditional parametric products rely on a single data provider (a weather station, an airport authority, a seismic network). Single-source data is vulnerable to manipulation, outage, and error. A single faulty weather station reading could trigger millions in payouts -- or fail to trigger legitimate ones.

2. **Execution problem.** Even when the trigger is objectively met, the payout still requires human execution -- someone at the insurance company must approve the transfer, initiate the wire, and update the records. This reintroduces delay, error, and the possibility of dispute.

3. **Adjudication problem.** Not every parametric trigger is clean. Edge cases exist: the rainfall was 51mm vs the 50mm threshold, the flight was delayed 2h59m vs the 3h trigger, the earthquake magnitude was revised after the initial reading. Who handles these? Traditional parametric products either eat the ambiguity (paying on edge cases regardless) or reintroduce human adjusters for borderline situations -- defeating the purpose.

### Why CRE is the Perfect Infrastructure for Parametric Insurance

Chainlink's CRE (Chainlink Runtime Environment) solves all three problems simultaneously:

| Problem | CRE Solution |
|---------|-------------|
| **Oracle problem** | **Multi-source HTTP Client + Consensus**: CRE workflows fetch data from 2-3 independent data sources (OpenWeatherMap, WeatherAPI, NOAA) and use DON consensus to agree on the values. No single data source can manipulate a trigger. Consensus modes (byFields, byMedian) ensure Byzantine fault tolerance across sources. |
| **Execution problem** | **Cron Trigger + EVM Write**: CRE cron workflows automatically monitor trigger conditions at configured intervals (every 5 minutes, every hour, daily). When a trigger fires, the workflow writes directly to the smart contract via EVM Write to distribute payouts. No human approval required. No delay between trigger and payout. |
| **Adjudication problem** | **HTTP Client (AI -- Gemini) inside TEE**: For edge cases and ambiguous triggers, the CRE workflow sends all multi-source data to an AI model (Gemini) running inside the TEE. The AI reviews the data, considers context (was the sensor reading anomalous? was there a data revision?), and returns a confidence score (0-1). High confidence triggers automatic payout. Low confidence flags for review. The AI adjudication is deterministic across DON nodes because the same data and prompt produce the same result within the TEE. |

**CRE gives us a parametric oracle:** a system that autonomously fetches real-world data, reaches consensus across multiple sources, adjudicates edge cases with AI, and executes payouts on-chain -- all without human intervention.

**The result is Surely:** an insurance protocol where pools are created with custom trigger conditions, CRE workflows monitor real-world data continuously, AI adjudicates edge cases, and instant payouts happen when triggers fire. No claims process. No adjusters. No waiting.

---

## 2. Core Features

### 2.1 Pool Creation

**What it does:** Anyone can create an insurance pool by defining trigger conditions, data sources, verification parameters, premium and payout amounts, and pool duration. The pool is deployed as a smart contract via the SurelyFactory, and a CRE monitoring workflow is registered for the pool.

**Pool creation parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `poolType` | Category of insurance (weather, flight, seismic, crypto, fire) | `weather_drought` |
| `triggerCondition` | The threshold that must be crossed for the trigger to fire | `rainfall_mm < 50 AND duration_days >= 30` |
| `dataSources` | Array of 2-3 independent API endpoints to fetch trigger data from | `[openweathermap.org/api, weatherapi.com/api, api.weather.gov]` |
| `dataFields` | Which JSON fields to extract from each data source response | `["current.precip_mm", "data.precipitation", "properties.quantitativePrecipitation"]` |
| `consensusMode` | How DON nodes agree on values across sources | `byMedian` (take median of 3 sources) or `byFields` (all sources must agree within tolerance) |
| `verificationFrequency` | How often the CRE cron workflow fetches and checks data | `3600` (seconds -- every 1 hour) |
| `premiumAmount` | Amount each policyholder pays to purchase coverage | `0.05 ETH` |
| `maxPayout` | Maximum payout per policyholder when the trigger fires | `0.5 ETH` |
| `poolDuration` | How long the pool remains active before expiry | `2592000` (seconds -- 30 days) |
| `minPolicyholders` | Minimum number of policyholders before the pool activates monitoring | `5` |
| `maxPolicyholders` | Maximum number of policyholders the pool can accept | `100` |
| `region` | Geographic area the pool covers (for location-specific triggers) | `{"lat": 34.05, "lng": -118.25, "radius_km": 50}` |
| `underwriterMinDeposit` | Minimum liquidity deposit for underwriters | `5 ETH` |

**How it works:**

1. Pool creator fills out the pool creation form on the frontend (wizard-style UI with validation at each step).
2. The frontend calls the `SurelyFactory.createPool()` function, passing all parameters.
3. The factory deploys a new `InsurancePool` contract with the specified configuration.
4. The factory registers a CRE monitoring workflow for the new pool (cron trigger with the specified frequency).
5. The factory emits a `PoolCreated` event with the pool address, parameters, and workflow ID.
6. The pool enters "funding" state -- underwriters can deposit liquidity, policyholders cannot yet purchase.
7. Once the underwriter minimum deposit is met and the pool start time arrives, the pool transitions to "active" and monitoring begins.

**Validation rules:**

- At least 2 data sources required (3 recommended).
- Verification frequency must be between 60 seconds and 86400 seconds (1 minute to 1 day).
- Premium amount must be at least 0.001 ETH.
- Max payout must be greater than premium (minimum 2x).
- Pool duration must be between 1 day and 365 days.
- Data source URLs must be reachable (validated at creation time via test fetch).

### 2.2 Policy Purchase

**What it does:** Users browse active insurance pools, evaluate the terms, and purchase a policy by depositing the premium amount. They receive a Policy NFT (ERC-721) that represents their coverage and encodes all policy terms on-chain.

**How it works:**

1. User connects wallet via Thirdweb Connect (email/social login or existing wallet).
2. User browses active pools on the Explore Pools page, filtered by category, region, and premium range.
3. User selects a pool and reviews the full terms: trigger condition, data sources, premium, max payout, duration, current policyholder count.
4. User clicks "Purchase Policy" and confirms the premium deposit transaction.
5. The `InsurancePool.purchasePolicy()` function is called:
   - Premium is transferred from user to the pool contract.
   - A `PolicyNFT` is minted to the user's wallet.
   - The policyholder is registered in the pool's internal mapping.
   - A `PolicyPurchased` event is emitted.
6. The Policy NFT metadata includes:
   - Pool address
   - Premium paid
   - Coverage amount (max payout)
   - Purchase timestamp
   - Expiry timestamp
   - Trigger condition (human-readable description)
   - Policy status (active, triggered, expired, refunded)

**Policy NFT utility:**

- Proof of coverage -- verifiable on-chain.
- Transferable -- policyholders can sell or transfer their coverage to another address.
- Composable -- other DeFi protocols can use the NFT as collateral or build on top of it.
- Claim receipt -- when a trigger fires, the NFT metadata is updated to reflect the payout amount and transaction hash.

### 2.3 Automated Monitoring

**What it does:** CRE cron workflows automatically fetch data from configured sources at the specified verification frequency, check trigger conditions, and log monitoring data on-chain for full transparency. This runs 24/7 without human intervention.

**How it works:**

1. Each active pool has a dedicated CRE cron workflow that fires at the configured `verificationFrequency`.
2. On each tick, the workflow:
   a. Fetches data from all configured data sources (2-3 HTTP Client calls in parallel).
   b. Extracts the relevant fields from each response using the configured `dataFields` paths.
   c. Applies the configured consensus mode across all sources.
   d. Reads the pool's trigger conditions from the smart contract via EVM Read.
   e. Compares the consensus value against the trigger threshold.
   f. Writes a monitoring log entry on-chain via EVM Write (timestamp, fetched values, consensus value, trigger status).
3. If the trigger condition is NOT met: the monitoring log is written and the workflow completes. The next cron tick will run again at the configured interval.
4. If the trigger condition IS met: the workflow proceeds to the Trigger Resolution workflow (Section 4, Workflow 3).

**Monitoring transparency:**

- Every data fetch is logged on-chain with the raw values from each source and the consensus result.
- Policyholders and underwriters can see the real-time monitoring dashboard on the Pool Detail page.
- If a data source is unavailable, the workflow logs the failure and continues with the remaining sources (minimum 2 required for consensus).
- If fewer than 2 sources return data, the workflow logs a "data insufficient" event and skips the trigger check for that tick.

### 2.4 Multi-Source Verification

**What it does:** Every trigger check fetches data from 2-3 independent data sources and uses DON consensus to prevent single-source manipulation, outage, or error from causing false triggers or missed triggers.

**Consensus modes:**

| Mode | How it works | When to use |
|------|-------------|-------------|
| `byMedian` | Each DON node fetches all sources. The median value across all sources is taken as the consensus value. | Continuous numeric data (temperature, rainfall, river level, price). Median is robust against a single outlier source. |
| `byFields` | Each DON node fetches all sources. All sources must agree within a configured tolerance (e.g., +/- 5%). If any source deviates beyond tolerance, the check is flagged for review. | Binary or categorical data (flight delayed: yes/no, earthquake detected: yes/no). |
| `byMajority` | Each DON node fetches all sources. The majority value (2-of-3 or 3-of-5) is taken as consensus. | Discrete threshold crossings where sources may disagree on exact values but agree on whether the threshold was crossed. |

**Why multi-source matters:**

- A single weather station can malfunction, giving a false reading that triggers (or fails to trigger) millions in payouts.
- A single flight data API can have a delay in reporting, missing the trigger window.
- A single seismic network can revise magnitude estimates after the initial reading.
- Multi-source consensus with DON agreement makes the trigger determination Byzantine fault tolerant -- an attacker would need to compromise multiple independent data sources AND a majority of DON nodes simultaneously.

### 2.5 AI Adjudication

**What it does:** For complex, ambiguous, or borderline trigger events, the CRE workflow sends all multi-source data to an AI model (Gemini) running inside the TEE. The AI reviews the full data context and returns a confidence score (0 to 1) that determines the resolution path.

**When AI adjudication is invoked:**

- The consensus value is within 10% of the trigger threshold (borderline case).
- Data sources disagree beyond the configured tolerance (conflicting data).
- A data source returned an error or anomalous value (suspect data).
- The trigger condition involves a composite of multiple variables (complex trigger).

**How it works:**

1. The CRE workflow assembles a structured prompt containing:
   - All raw data values from each source, timestamped.
   - The trigger condition definition.
   - Historical monitoring data for the past N ticks.
   - Any data source errors or anomalies detected.
2. The prompt is sent to Gemini via HTTP Client inside the TEE.
3. Gemini returns a structured JSON response:
   ```json
   {
     "confidence": 0.87,
     "triggered": true,
     "reasoning": "All three sources confirm rainfall below threshold. Source 2 reported slightly higher value (52mm vs 48mm median) but is within sensor variance. Historical trend shows consistent decline over 28 days. High confidence trigger.",
     "data_quality": "good",
     "anomalies_detected": false
   }
   ```
4. The confidence score determines the resolution:

| Confidence Range | Resolution | Action |
|-----------------|------------|--------|
| **> 0.8** | Confirmed trigger | Proceed to automatic payout. No human review required. |
| **0.5 - 0.8** | Probable trigger | Flag for review. Partial payout (proportional to confidence) may be issued. Pool admin can override. |
| **< 0.5** | Likely false alarm | Log the event. Continue monitoring. No payout. Pool admin notified. |

**Privacy and determinism:**

- The AI call happens inside the TEE -- DON nodes do not see the prompt or response in plaintext.
- The same data and prompt produce the same AI response within the TEE, ensuring determinism across DON nodes.
- The AI reasoning is logged on-chain (encrypted) for auditability.

### 2.6 Instant Payout

**What it does:** When a trigger fires and is confirmed (either directly or via AI adjudication), the CRE workflow automatically distributes payouts to ALL policyholders in the pool. No claim filing. No approval process. No waiting.

**How it works:**

1. The trigger is confirmed (confidence > 0.8 or direct threshold crossing with clean consensus).
2. The CRE workflow calls `InsurancePool.processPayout()` via EVM Write.
3. The contract calculates each policyholder's payout:
   - Base payout = `maxPayout` (if pool has sufficient funds).
   - If pool funds are insufficient to cover all policyholders at max payout, payouts are distributed pro-rata based on premium paid.
4. The contract iterates through all registered policyholders and transfers their payout amount.
5. Each `PolicyNFT` metadata is updated to reflect the payout: amount received, transaction hash, trigger data.
6. A `PoolTriggered` event is emitted with the trigger data, AI confidence (if applicable), and total payout amount.
7. The pool transitions to "settled" state. No further monitoring occurs.

**Payout guarantees:**

- Payouts are funded by underwriter deposits plus accumulated premiums.
- If the pool has insufficient funds (extreme scenario), payouts are pro-rata -- no policyholder is zeroed out.
- Payout transactions are atomic -- all policyholders are paid in the same transaction (or in batched transactions for large pools).
- Gas costs for payout distribution are covered by the pool's fee reserve.

### 2.7 Pool Liquidity (Underwriting)

**What it does:** Underwriters deposit liquidity into insurance pools, taking the "house" side of the bet. They earn premiums from policyholders if the trigger does not fire during the pool's lifetime. If the trigger fires, underwriter funds are used to pay policyholders.

**How it works:**

1. Underwriter browses the Underwrite page, which lists all pools in "funding" state.
2. Underwriter evaluates a pool's risk: trigger condition, historical data (how often has this trigger fired in the past?), premium-to-payout ratio, pool duration.
3. Underwriter deposits liquidity into the pool by calling `UnderwriterVault.deposit()`.
4. The deposit is tracked as a share of the pool's total underwriting capacity.
5. If the pool expires without triggering:
   - Underwriter receives their deposit back PLUS their proportional share of all premiums collected (minus the protocol fee).
   - Yield = (total premiums * underwriter share percentage) - protocol fee.
6. If the pool triggers:
   - Underwriter deposit is used to fund policyholder payouts.
   - Underwriter may lose part or all of their deposit depending on total payout obligations.
   - Any remaining funds after payouts are returned to underwriters.
7. Underwriters can withdraw unused liquidity from pools that have not yet activated (still in "funding" state) but cannot withdraw after the pool is active.

**Risk/reward for underwriters:**

| Scenario | Underwriter Outcome |
|----------|-------------------|
| Pool expires, no trigger | Deposit returned + premium income (yield) |
| Pool triggers, partial payout | Deposit partially returned + no premium income |
| Pool triggers, full payout | Deposit lost (used for policyholder payouts) |

### 2.8 ACE Compliance

**What it does:** The Automated Compliance Engine (ACE) enforces regulatory requirements on the protocol: KYC for large payouts, geographic restrictions, rate limiting, and underwriter qualification.

See Section 6 for full ACE policy details.

---

## 3. Insurance Pool Types

### 3.1 Crop Drought Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Cumulative rainfall < 50mm over a rolling 30-day period within the insured region |
| **Data sources** | OpenWeatherMap Historical API, WeatherAPI Forecast/History, NOAA Climate Data Online |
| **Data fields** | `daily.rain` (OWM), `forecast.forecastday.day.totalprecip_mm` (WeatherAPI), `results.value` (NOAA GHCND) |
| **Consensus mode** | `byMedian` -- median cumulative rainfall across 3 sources |
| **Verification frequency** | Every 6 hours (4x daily) |
| **Typical premium** | 0.02-0.05 ETH per policy (scales with region risk and season) |
| **Typical max payout** | 0.5-2.0 ETH per policy |
| **Pool duration** | 90-180 days (one growing season) |
| **Target users** | Smallholder farmers, agricultural cooperatives, crop lenders |

**How the trigger works:** The CRE workflow fetches daily precipitation data for the configured GPS coordinates from all 3 sources every 6 hours. It maintains a rolling 30-day cumulative total. When the median cumulative rainfall across sources drops below the 50mm threshold, the trigger fires. AI adjudication is invoked if sources disagree by more than 15% or if the cumulative total is within 5mm of the threshold.

### 3.2 Flight Delay Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Flight arrival delay > 180 minutes (3 hours) from scheduled arrival |
| **Data sources** | AviationStack Real-Time Flights API, FlightAware AeroAPI, FlightsLogic API |
| **Data fields** | `arrival.delay` (AviationStack), `arrivals.delay` (FlightAware), `flight.delay_minutes` (FlightsLogic) |
| **Consensus mode** | `byMajority` -- 2-of-3 sources must agree the delay exceeds threshold |
| **Verification frequency** | Every 15 minutes (starting 2 hours before scheduled arrival) |
| **Typical premium** | 0.005-0.02 ETH per policy |
| **Typical max payout** | 0.05-0.2 ETH per policy |
| **Pool duration** | 1-3 days (covers a single flight or round trip) |
| **Target users** | Business travelers, frequent flyers, travel agencies |

**How the trigger works:** The policyholder specifies a flight number and date when purchasing the policy. The CRE workflow begins monitoring 2 hours before scheduled arrival. Every 15 minutes, it fetches real-time flight status from all 3 sources. If 2-of-3 sources report a delay exceeding 180 minutes (or flight cancellation), the trigger fires. AI adjudication handles edge cases: diversion to alternate airport, partial delay with gate hold, cancelled-then-rebooked.

### 3.3 Earthquake Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Earthquake magnitude >= 5.0 within 100km radius of insured coordinates |
| **Data sources** | USGS Earthquake Hazards API, EMSC (European-Mediterranean Seismological Centre), GeoNet (New Zealand -- for global feed) |
| **Data fields** | `properties.mag` + `geometry.coordinates` (USGS), `mag` + `lat/lon` (EMSC), `magnitude` + `coordinates` (GeoNet) |
| **Consensus mode** | `byMedian` -- median magnitude across sources, with distance validation |
| **Verification frequency** | Every 5 minutes (seismic events require rapid detection) |
| **Typical premium** | 0.03-0.1 ETH per policy |
| **Typical max payout** | 1.0-5.0 ETH per policy |
| **Pool duration** | 30-365 days |
| **Target users** | Property owners in seismic zones, construction companies, municipalities |

**How the trigger works:** The CRE workflow fetches recent earthquake events from all 3 global seismic networks every 5 minutes. It filters events by geographic proximity (within 100km of the insured coordinates) and checks if any event's magnitude meets or exceeds the threshold. Seismic magnitudes are frequently revised in the hours after an event -- the AI adjudication model evaluates whether the initial magnitude report is likely to hold, considering historical revision patterns for the source network and region.

### 3.4 Stablecoin Depeg Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Stablecoin price < $0.95 sustained for >= 60 consecutive minutes |
| **Data sources** | CoinGecko API, Chainlink Price Feeds (on-chain), CoinMarketCap API |
| **Data fields** | `market_data.current_price.usd` (CoinGecko), `latestRoundData.answer` (Chainlink), `data.quote.USD.price` (CMC) |
| **Consensus mode** | `byMedian` -- median price across 3 sources |
| **Verification frequency** | Every 5 minutes |
| **Typical premium** | 0.01-0.05 ETH per policy |
| **Typical max payout** | 0.5-3.0 ETH per policy |
| **Pool duration** | 30-90 days |
| **Target users** | DeFi protocols with stablecoin exposure, stablecoin holders, liquidity providers |

**How the trigger works:** The CRE workflow fetches the stablecoin's USD price from all 3 sources every 5 minutes. If the median price drops below $0.95, the workflow begins counting consecutive ticks below threshold. After 12 consecutive ticks (60 minutes) below $0.95, the trigger fires. This duration requirement prevents false triggers from momentary flash crashes or API glitches. AI adjudication evaluates whether the depeg is likely to be temporary (exchange-specific liquidity issue) or fundamental (backing insolvency, regulatory action).

### 3.5 Extreme Heat / Cold Wave Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition (heat)** | Maximum daily temperature > 45C for 3 consecutive days within insured region |
| **Trigger condition (cold)** | Minimum daily temperature < -25C for 3 consecutive days within insured region |
| **Data sources** | OpenWeatherMap One Call API, WeatherAPI History, NOAA Global Historical Climatology Network |
| **Data fields** | `daily.temp.max` / `daily.temp.min` (OWM), `forecast.forecastday.day.maxtemp_c` (WeatherAPI), `results[].value` (NOAA GHCND TMAX/TMIN) |
| **Consensus mode** | `byMedian` -- median temperature across sources |
| **Verification frequency** | Every 4 hours (6x daily) |
| **Typical premium** | 0.01-0.04 ETH per policy |
| **Typical max payout** | 0.3-1.5 ETH per policy |
| **Pool duration** | 30-120 days (seasonal -- summer for heat, winter for cold) |
| **Target users** | Outdoor event organizers, agricultural operations, energy companies, municipalities |

**How the trigger works:** The CRE workflow fetches daily high/low temperatures from all 3 sources every 4 hours. It tracks consecutive days where the temperature exceeds (heat) or drops below (cold) the threshold. After 3 consecutive qualifying days, the trigger fires. AI adjudication handles sensor anomalies (urban heat island effect in one station, elevation differences between stations).

### 3.6 Flood Insurance (River Level)

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | River gauge level > configured flood stage threshold (meters) sustained for >= 6 hours |
| **Data sources** | USGS National Water Information System (NWIS), NOAA National Weather Service River Forecasts, European Flood Awareness System (EFAS) |
| **Data fields** | `value.timeSeries[].values[].value` (USGS NWIS), `observed.primary` (NWS), `timeseries.data` (EFAS) |
| **Consensus mode** | `byMedian` -- median gauge level, with station proximity weighting |
| **Verification frequency** | Every 30 minutes (flood events develop rapidly) |
| **Typical premium** | 0.02-0.08 ETH per policy |
| **Typical max payout** | 1.0-5.0 ETH per policy |
| **Pool duration** | 60-180 days (monsoon/rainy season) |
| **Target users** | Floodplain property owners, municipalities, agricultural operations, logistics companies |

**How the trigger works:** The CRE workflow fetches river gauge readings from stations within 25km of the insured location every 30 minutes. It tracks whether the gauge level exceeds the configured flood stage threshold. After 12 consecutive ticks (6 hours) above threshold, the trigger fires. The duration requirement prevents false triggers from momentary surges (dam releases, tidal effects). AI adjudication evaluates upstream conditions and forecast data to assess whether the flood stage is likely to worsen or recede.

### 3.7 Wildfire Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Active fire detection (satellite hotspot) within configured radius of insured coordinates, confirmed by 2+ satellite passes |
| **Data sources** | NASA FIRMS (Fire Information for Resource Management System), NOAA Hazard Mapping System, Copernicus Emergency Management Service |
| **Data fields** | `latitude, longitude, confidence, acq_date` (FIRMS CSV), `fire_points.coordinates` (NOAA HMS), `activeFires.geometry` (Copernicus) |
| **Consensus mode** | `byMajority` -- 2-of-3 satellite sources must detect a fire within the radius |
| **Verification frequency** | Every 3 hours (aligned with satellite pass intervals -- MODIS/VIIRS pass every ~3 hours) |
| **Typical premium** | 0.03-0.1 ETH per policy |
| **Typical max payout** | 2.0-10.0 ETH per policy |
| **Pool duration** | 60-180 days (fire season) |
| **Target users** | Rural property owners, timber companies, vineyard/winery operators, tourism businesses |

**How the trigger works:** The CRE workflow queries satellite fire detection databases every 3 hours, filtering for hotspots within the configured radius of the insured coordinates. If 2-of-3 sources detect fire activity on at least 2 consecutive satellite passes (to filter out false positives from industrial heat, sun glint, or volcanic activity), the trigger fires. AI adjudication evaluates fire confidence scores, proximity to insured coordinates, fire spread direction (using wind data), and whether the detection is a known non-fire source.

### 3.8 Crypto Crash Insurance

| Parameter | Value |
|-----------|-------|
| **Trigger condition** | Asset price drops > 20% within a rolling 24-hour window |
| **Data sources** | CoinGecko API, Chainlink Price Feeds (on-chain), Binance API (spot price) |
| **Data fields** | `market_data.price_change_percentage_24h` (CoinGecko), `latestRoundData.answer` vs 24h prior (Chainlink), `ticker.priceChangePercent` (Binance) |
| **Consensus mode** | `byMedian` -- median 24h price change across sources |
| **Verification frequency** | Every 10 minutes |
| **Typical premium** | 0.02-0.1 ETH per policy |
| **Typical max payout** | 0.5-3.0 ETH per policy |
| **Pool duration** | 7-30 days |
| **Target users** | Crypto holders wanting downside protection, DeFi protocols, funds, treasuries |

**How the trigger works:** The CRE workflow fetches the current price and the price from 24 hours ago from all 3 sources every 10 minutes. It calculates the percentage change for each source and takes the median. If the median 24h change exceeds -20%, the trigger fires. AI adjudication handles exchange-specific anomalies (flash crash on one exchange, API lag, stale price feeds) and evaluates whether the drop is reflected across the broader market or isolated to a single venue.

---

## 4. Full CRE Architecture

### Workflow 1: Pool Creation

**Trigger:** HTTP Trigger (pool creator submits via frontend application)
**Capabilities:** EVM Read, EVM Write

```
Frontend App                  CRE Workflow                        Blockchain
------------                  ------------                        ----------

[Creator submits         HTTP Trigger
 pool parameters]  -----> (receives pool config JSON)
                              |
                              v
                    EVM Read:
                      - Validate creator address has
                        sufficient creation fee
                      - Check factory is not paused
                      - Validate pool parameters against
                        factory constraints (min/max values)
                              |
                              v
                    HTTP Client (x2-3):
                      - Test fetch each configured data
                        source URL to validate reachability
                      - Extract configured data fields to
                        validate field paths are correct
                      - Log test values for pool creator
                        to verify data source is returning
                        expected data format
                              |
                              v
                    EVM Write:
                      - Call SurelyFactory.createPool()
                        with all validated parameters
                      - Factory deploys new InsurancePool
                        contract via CREATE2
                      - Factory registers pool in its
                        pool registry mapping
                      - Factory collects creation fee
                      - Emit PoolCreated event with:
                        pool address, creator, config hash,
                        data source URLs, trigger condition
                              |
                              v
                    InsurancePool.sol deployed
                    (state: FUNDING)
                    CRE monitoring workflow registered
                    (inactive until pool activates)
```

**CRE workflow code structure (TypeScript):**

```typescript
// pool-creation/main.ts
import { cre, getNetwork } from "@cre/sdk";

interface PoolConfig {
  poolType: string;
  triggerCondition: string;
  dataSources: string[];
  dataFields: string[];
  consensusMode: string;
  verificationFrequency: number;
  premiumAmount: string;
  maxPayout: string;
  poolDuration: number;
  minPolicyholders: number;
  maxPolicyholders: number;
  region: { lat: number; lng: number; radius_km: number };
  underwriterMinDeposit: string;
}

const workflow = cre.workflow({
  name: "surely-pool-creation",
  trigger: cre.httpTrigger(),
  config: {
    evms: [
      {
        factoryAddress: "0x...",
        chainSelectorName: "base-sepolia",
        gasLimit: "3000000",
      },
    ],
  },
});

workflow.handle(async (input, config) => {
  const poolConfig: PoolConfig = input.body;
  const network = getNetwork(config.evms[0].chainSelectorName);

  // Step 1: Validate creator and factory state
  const [creatorBalance, factoryPaused, creationFee] = await Promise.all([
    cre.evmRead(network, {
      contractAddress: config.evms[0].factoryAddress,
      method: "getCreatorBalance",
      args: [input.headers["x-creator-address"]],
    }),
    cre.evmRead(network, {
      contractAddress: config.evms[0].factoryAddress,
      method: "paused",
    }),
    cre.evmRead(network, {
      contractAddress: config.evms[0].factoryAddress,
      method: "creationFee",
    }),
  ]);

  if (factoryPaused) throw new Error("Factory is paused");
  if (BigInt(creatorBalance) < BigInt(creationFee))
    throw new Error("Insufficient creation fee");

  // Step 2: Validate data sources are reachable
  for (let i = 0; i < poolConfig.dataSources.length; i++) {
    const response = await cre.httpClient({
      url: poolConfig.dataSources[i],
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (response.status !== 200) {
      throw new Error(`Data source ${i} unreachable: ${poolConfig.dataSources[i]}`);
    }
    // Validate field path exists in response
    const fieldValue = extractField(response.body, poolConfig.dataFields[i]);
    if (fieldValue === undefined) {
      throw new Error(`Field path ${poolConfig.dataFields[i]} not found in source ${i}`);
    }
  }

  // Step 3: Deploy pool contract
  const tx = await cre.evmWrite(network, {
    contractAddress: config.evms[0].factoryAddress,
    method: "createPool",
    args: [
      poolConfig.poolType,
      poolConfig.triggerCondition,
      poolConfig.dataSources,
      poolConfig.dataFields,
      poolConfig.consensusMode,
      poolConfig.verificationFrequency,
      poolConfig.premiumAmount,
      poolConfig.maxPayout,
      poolConfig.poolDuration,
      poolConfig.minPolicyholders,
      poolConfig.maxPolicyholders,
      encodeRegion(poolConfig.region),
      poolConfig.underwriterMinDeposit,
    ],
    gasLimit: config.evms[0].gasLimit,
  });

  return { success: true, txHash: tx.hash };
});
```

### Workflow 2: Trigger Monitoring (The Core Loop)

**Trigger:** Cron Trigger (every N seconds per pool configuration)
**Capabilities:** HTTP Client (x2-3), EVM Read, EVM Write, Consensus (byFields/byMedian/byMajority)

```
                          CRE Workflow                         External
                          ------------                         --------

                    Cron Trigger
                    (fires every N seconds per pool config)
                              |
                              v
                    EVM Read:
                      - Get pool state (must be ACTIVE)
                      - Get trigger condition parameters
                      - Get data source URLs and field paths
                      - Get consensus mode
                      - Get accumulated monitoring data
                              |
                              v
                    HTTP Client (Source 1):        -----> OpenWeatherMap / AviationStack / USGS / etc.
                      - Fetch data from source 1   <----- (JSON response)
                      - Extract configured field
                      - value_1 = extractField(response, fieldPath_1)
                              |
                    HTTP Client (Source 2):        -----> WeatherAPI / FlightAware / EMSC / etc.
                      - Fetch data from source 2   <----- (JSON response)
                      - Extract configured field
                      - value_2 = extractField(response, fieldPath_2)
                              |
                    HTTP Client (Source 3):        -----> NOAA / FlightsLogic / GeoNet / etc.
                      - Fetch data from source 3   <----- (JSON response)
                      - Extract configured field
                      - value_3 = extractField(response, fieldPath_3)
                              |
                              v
                    Consensus:
                      - Mode: byMedian / byFields / byMajority
                      - Input: [value_1, value_2, value_3]
                      - Output: consensus_value
                      - If source unavailable: log failure,
                        continue with remaining sources
                        (minimum 2 required)
                      - If < 2 sources available: log
                        "data insufficient", skip check
                              |
                              v
                    Compare consensus_value against
                    trigger threshold:
                              |
                     +--------+--------+
                     |                 |
              NOT triggered        TRIGGERED
                     |                 |
                     v                 v
              EVM Write:         Check if borderline
              - Log monitoring     (within 10% of threshold
                data on-chain:     OR sources disagree
                timestamp,         beyond tolerance):
                values per            |
                source,          +----+----+
                consensus        |         |
                value,        CLEAN     BORDERLINE
                trigger       TRIGGER     |
                status:       |           v
                "monitoring"  |    --> Workflow 3
                              |       (with AI adjudication)
                              |
                              v
                        --> Workflow 3
                           (direct payout)
```

**CRE workflow code structure (TypeScript):**

```typescript
// trigger-monitoring/main.ts
import { cre, getNetwork } from "@cre/sdk";

interface MonitoringConfig {
  evms: Array<{
    poolAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }>;
}

const workflow = cre.workflow({
  name: "surely-trigger-monitoring",
  trigger: cre.cronTrigger(), // frequency set per pool at registration
  config: {} as MonitoringConfig,
});

workflow.handle(async (input, config) => {
  const network = getNetwork(config.evms[0].chainSelectorName);
  const poolAddress = config.evms[0].poolAddress;

  // Step 1: Read pool state and config
  const [poolState, triggerConfig, dataSources, dataFields, consensusMode] =
    await Promise.all([
      cre.evmRead(network, {
        contractAddress: poolAddress,
        method: "getPoolState",
      }),
      cre.evmRead(network, {
        contractAddress: poolAddress,
        method: "getTriggerConfig",
      }),
      cre.evmRead(network, {
        contractAddress: poolAddress,
        method: "getDataSources",
      }),
      cre.evmRead(network, {
        contractAddress: poolAddress,
        method: "getDataFields",
      }),
      cre.evmRead(network, {
        contractAddress: poolAddress,
        method: "getConsensusMode",
      }),
    ]);

  if (poolState !== "ACTIVE") return { skipped: true, reason: "Pool not active" };

  // Step 2: Fetch from all data sources
  const values: (number | null)[] = [];
  const rawResponses: any[] = [];

  for (let i = 0; i < dataSources.length; i++) {
    try {
      const response = await cre.httpClient({
        url: dataSources[i],
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const value = extractField(response.body, dataFields[i]);
      values.push(typeof value === "number" ? value : parseFloat(value));
      rawResponses.push({ source: i, value, status: "ok" });
    } catch (err) {
      values.push(null);
      rawResponses.push({ source: i, value: null, status: "error", error: err.message });
    }
  }

  // Step 3: Check minimum source availability
  const validValues = values.filter((v) => v !== null) as number[];
  if (validValues.length < 2) {
    await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "logMonitoring",
      args: [Date.now(), encodeValues(rawResponses), 0, "DATA_INSUFFICIENT"],
      gasLimit: config.evms[0].gasLimit,
    });
    return { status: "data_insufficient", validSources: validValues.length };
  }

  // Step 4: Apply consensus
  let consensusValue: number;
  switch (consensusMode) {
    case "byMedian":
      consensusValue = median(validValues);
      break;
    case "byMajority":
      consensusValue = majority(validValues, triggerConfig.threshold);
      break;
    case "byFields":
      consensusValue = fieldConsensus(validValues, triggerConfig.tolerance);
      break;
    default:
      consensusValue = median(validValues);
  }

  // Step 5: Evaluate trigger condition
  const triggered = evaluateTrigger(consensusValue, triggerConfig);
  const borderline = isBorderline(consensusValue, triggerConfig, validValues);

  if (!triggered) {
    // Log monitoring data, continue
    await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "logMonitoring",
      args: [Date.now(), encodeValues(rawResponses), consensusValue, "MONITORING"],
      gasLimit: config.evms[0].gasLimit,
    });
    return { status: "monitoring", consensusValue, triggered: false };
  }

  // Step 6: Trigger fired -- resolve
  if (borderline) {
    // Invoke AI adjudication (Workflow 3 with AI)
    return await resolveWithAI(network, poolAddress, rawResponses, consensusValue, triggerConfig, config);
  } else {
    // Clean trigger -- direct payout (Workflow 3 without AI)
    return await processDirectPayout(network, poolAddress, rawResponses, consensusValue, config);
  }
});
```

### Workflow 3: Trigger Resolution + Payout

**Trigger:** Invoked by Workflow 2 when a trigger fires
**Capabilities:** HTTP Client (AI -- Gemini), EVM Read, EVM Write

```
[Continued from Workflow 2 when trigger fires]
                              |
                              v
                    HTTP Client (AI -- Gemini):       -----> Gemini API
                      - Construct structured prompt:          (inside TEE)
                        * All raw data values from             <----- JSON response
                          each source, timestamped
                        * Trigger condition definition
                        * Historical monitoring data
                          (past N ticks from on-chain logs)
                        * Data source errors/anomalies
                      - Send to Gemini via HTTP Client
                      - Receive confidence-scored response
                              |
                              v
                    Evaluate AI confidence score:
                              |
                     +--------+--------+--------+
                     |        |                 |
                  > 0.8    0.5 - 0.8          < 0.5
               CONFIRMED   PROBABLE         FALSE ALARM
                     |        |                 |
                     v        v                 v
              EVM Write:  EVM Write:       EVM Write:
              - Call      - Flag pool       - Log false
                pool.       for review        alarm event
                process   - Issue partial   - Continue
                Payout()    payout            monitoring
              - Iterate     (proportional   - Notify pool
                all         to confidence)    admin
                policy-   - Notify pool
                holders     admin for
              - Transfer    manual review
                payouts   - Emit
              - Update      PoolFlagged
                each        event
                PolicyNFT
                metadata
              - Emit
                PoolTriggered
                event
              - Set pool
                state to
                SETTLED
```

**AI adjudication prompt structure:**

```typescript
async function resolveWithAI(
  network: any,
  poolAddress: string,
  rawResponses: any[],
  consensusValue: number,
  triggerConfig: any,
  config: any
) {
  // Fetch historical monitoring data
  const history = await cre.evmRead(network, {
    contractAddress: poolAddress,
    method: "getMonitoringHistory",
    args: [20], // last 20 ticks
  });

  const prompt = {
    role: "You are a parametric insurance adjudicator. Analyze the following data and determine if the trigger condition has been genuinely met.",
    context: {
      trigger_condition: triggerConfig.condition,
      threshold: triggerConfig.threshold,
      consensus_value: consensusValue,
      data_sources: rawResponses,
      historical_readings: history,
      pool_type: triggerConfig.poolType,
    },
    instructions: [
      "Evaluate whether the trigger condition is genuinely met based on all data sources.",
      "Consider data quality: are any sources returning anomalous values?",
      "Consider historical trend: is this reading consistent with the trend or a sudden anomaly?",
      "Consider source agreement: do sources broadly agree or is there significant divergence?",
      "Return a confidence score from 0.0 to 1.0 where 1.0 = absolute certainty trigger is met.",
      "Return structured JSON with: confidence, triggered (boolean), reasoning (string), data_quality (good/fair/poor), anomalies_detected (boolean).",
    ],
  };

  const aiResponse = await cre.httpClient({
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.geminiApiKey}`,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: JSON.stringify(prompt) }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  const result = JSON.parse(aiResponse.body.candidates[0].content.parts[0].text);

  if (result.confidence > 0.8) {
    // Confirmed -- full payout
    const tx = await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "processPayout",
      args: [encodeValues(rawResponses), consensusValue, result.confidence, result.reasoning],
      gasLimit: "5000000",
    });
    return { status: "triggered_payout", confidence: result.confidence, txHash: tx.hash };
  } else if (result.confidence >= 0.5) {
    // Probable -- partial payout + flag
    const tx = await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "flagForReview",
      args: [encodeValues(rawResponses), consensusValue, result.confidence, result.reasoning],
      gasLimit: "3000000",
    });
    return { status: "flagged_for_review", confidence: result.confidence, txHash: tx.hash };
  } else {
    // False alarm -- log and continue
    const tx = await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "logFalseAlarm",
      args: [encodeValues(rawResponses), consensusValue, result.confidence, result.reasoning],
      gasLimit: "500000",
    });
    return { status: "false_alarm", confidence: result.confidence, txHash: tx.hash };
  }
}
```

### Workflow 4: Pool Expiry

**Trigger:** Cron Trigger (fires at pool end date)
**Capabilities:** EVM Read, EVM Write

```
                          CRE Workflow                        Blockchain
                          ------------                        ----------

                    Cron Trigger
                    (fires at pool.endTimestamp)
                              |
                              v
                    EVM Read:
                      - Get pool state
                      - Check if pool was triggered
                        during its lifetime
                      - Get total premiums collected
                      - Get underwriter deposits
                      - Get policyholder count
                      - Get protocol fee percentage
                              |
                              v
                    Was the pool triggered?
                              |
                     +--------+--------+
                     |                 |
                 NOT triggered      Already SETTLED
                     |                 |
                     v                 v
              EVM Write:         EVM Write:
              - Calculate          - Close pool
                underwriter          (already settled)
                returns:           - Return any
                * Each               remaining dust
                  underwriter        to factory
                  gets deposit     - Emit
                  back +             PoolExpired
                  proportional       event
                  share of
                  total premiums
                  (minus protocol
                  fee)
              - Transfer returns
                to each underwriter
              - Transfer protocol
                fee to Surely
                treasury
              - Set pool state
                to EXPIRED
              - Emit PoolExpired
                event with:
                total premiums,
                underwriter returns,
                protocol fee collected,
                pool lifetime stats
```

**CRE workflow code structure (TypeScript):**

```typescript
// pool-expiry/main.ts
import { cre, getNetwork } from "@cre/sdk";

const workflow = cre.workflow({
  name: "surely-pool-expiry",
  trigger: cre.cronTrigger(), // scheduled for pool.endTimestamp
  config: {} as { evms: Array<{ poolAddress: string; chainSelectorName: string; gasLimit: string }> },
});

workflow.handle(async (input, config) => {
  const network = getNetwork(config.evms[0].chainSelectorName);
  const poolAddress = config.evms[0].poolAddress;

  // Step 1: Read pool state
  const [poolState, totalPremiums, underwriterDeposits, protocolFeeRate] = await Promise.all([
    cre.evmRead(network, { contractAddress: poolAddress, method: "getPoolState" }),
    cre.evmRead(network, { contractAddress: poolAddress, method: "getTotalPremiums" }),
    cre.evmRead(network, { contractAddress: poolAddress, method: "getTotalUnderwriterDeposits" }),
    cre.evmRead(network, { contractAddress: poolAddress, method: "getProtocolFeeRate" }),
  ]);

  if (poolState === "SETTLED") {
    // Pool already triggered and paid out -- just close it
    const tx = await cre.evmWrite(network, {
      contractAddress: poolAddress,
      method: "closePool",
      gasLimit: config.evms[0].gasLimit,
    });
    return { status: "closed_already_settled", txHash: tx.hash };
  }

  if (poolState !== "ACTIVE") {
    return { skipped: true, reason: `Pool in unexpected state: ${poolState}` };
  }

  // Step 2: Expire the pool -- return funds
  const tx = await cre.evmWrite(network, {
    contractAddress: poolAddress,
    method: "expirePool",
    gasLimit: "5000000",
  });

  return {
    status: "expired",
    totalPremiums,
    underwriterDeposits,
    protocolFeeCollected: (BigInt(totalPremiums) * BigInt(protocolFeeRate)) / 10000n,
    txHash: tx.hash,
  };
});
```

### Workflow 5: Emergency Override

**Trigger:** HTTP Trigger (admin flags emergency via admin panel or API)
**Capabilities:** EVM Read, EVM Write

```
Admin Panel                  CRE Workflow                        Blockchain
-----------                  ------------                        ----------

[Admin flags              HTTP Trigger
 emergency]  -----------> (receives: poolAddress,
                            adminAddress, reason)
                              |
                              v
                    EVM Read:
                      - Verify adminAddress has
                        ADMIN_ROLE on the pool
                      - Get current pool state
                        (must be ACTIVE or FUNDING)
                      - Verify pool is not already
                        paused or settled
                              |
                              v
                    Authorization check:
                      - Admin role confirmed?
                      - Pool in pausable state?
                              |
                     +--------+--------+
                     |                 |
                 AUTHORIZED       UNAUTHORIZED
                     |                 |
                     v                 v
              EVM Write:         Return error:
              - Call pool.         "Unauthorized or
                pausePool()         pool not in
              - Pause all           pausable state"
                monitoring
                workflows for
                this pool
              - Emit PoolPaused
                event with:
                admin address,
                reason code,
                timestamp
              - Notify all
                policyholders
                (event-based)
```

**Emergency reason codes:**

| Code | Reason | Effect |
|------|--------|--------|
| `0x01` | Data source outage | Pause monitoring until sources recover. No trigger checks during pause. |
| `0x02` | Suspected data manipulation | Pause monitoring + flag for security review. All recent monitoring data quarantined. |
| `0x03` | Smart contract vulnerability | Pause all pool operations. No deposits, purchases, or payouts until unpaused. |
| `0x04` | Regulatory directive | Pause pool per regulatory order. May require KYC review before resuming. |
| `0x05` | Market dislocation | Pause crypto-based pools during extreme volatility to prevent cascade triggers. |

**Resume flow:** Admin calls `unpausePool()` via the same HTTP Trigger workflow, which verifies admin role, checks the pause reason has been resolved, and restarts monitoring workflows.

---

## 5. Smart Contracts

### 5.1 SurelyFactory.sol

**Purpose:** Central factory contract that deploys and tracks all insurance pools, collects protocol fees, and manages global protocol configuration.

**Key state variables:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReceiverTemplate} from "@chainlink/cre-contracts/ReceiverTemplate.sol";

contract SurelyFactory {
    address public owner;
    address public treasury;
    uint256 public creationFee;          // Fee to create a new pool (in wei)
    uint256 public protocolFeeRate;      // Basis points (e.g., 250 = 2.5%)
    bool public paused;

    address[] public allPools;           // Array of all deployed pool addresses
    mapping(address => bool) public isPool;
    mapping(address => PoolInfo) public poolInfo;
    mapping(string => address[]) public poolsByType; // "weather_drought" => [pool1, pool2, ...]

    struct PoolInfo {
        address creator;
        string poolType;
        uint256 createdAt;
        bool active;
    }
}
```

**Key functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `createPool(PoolConfig calldata config)` | Public (payable) | Deploys a new InsurancePool contract via CREATE2. Caller must send `creationFee`. Validates all config parameters. Emits `PoolCreated` event. Returns new pool address. |
| `getAllPools()` | View | Returns array of all deployed pool addresses. |
| `getPoolsByType(string poolType)` | View | Returns array of pool addresses for a given type (weather, flight, etc.). |
| `getActivePools()` | View | Returns array of currently active pool addresses (state == ACTIVE). |
| `setCreationFee(uint256 fee)` | Owner only | Updates the pool creation fee. |
| `setProtocolFeeRate(uint256 rate)` | Owner only | Updates the protocol fee rate (basis points). Max 1000 (10%). |
| `setTreasury(address treasury)` | Owner only | Updates the treasury address for fee collection. |
| `pause() / unpause()` | Owner only | Pauses/unpauses all new pool creation. Existing pools continue operating. |
| `withdrawFees()` | Owner only | Withdraws accumulated creation fees to treasury. |

**Events:**

```solidity
event PoolCreated(
    address indexed poolAddress,
    address indexed creator,
    string poolType,
    bytes32 configHash,
    uint256 creationFee
);
event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
event ProtocolFeeRateUpdated(uint256 oldRate, uint256 newRate);
event FactoryPaused(address admin);
event FactoryUnpaused(address admin);
```

### 5.2 InsurancePool.sol

**Purpose:** Individual insurance pool contract. Holds policyholder premiums and underwriter deposits, stores trigger configuration, processes payouts when triggered, and handles pool lifecycle (funding -> active -> settled/expired).

**Inherits:** `ReceiverTemplate` from `@chainlink/cre-contracts` for receiving CRE workflow reports.

**Key state variables:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReceiverTemplate} from "@chainlink/cre-contracts/ReceiverTemplate.sol";

contract InsurancePool is ReceiverTemplate {
    enum PoolState { FUNDING, ACTIVE, SETTLED, EXPIRED, PAUSED }

    address public factory;
    address public creator;
    PoolState public state;

    // Trigger configuration
    string public poolType;
    string public triggerCondition;       // Human-readable condition
    bytes public triggerConfigEncoded;     // ABI-encoded trigger parameters
    string[] public dataSources;
    string[] public dataFields;
    string public consensusMode;
    uint256 public verificationFrequency;

    // Financial parameters
    uint256 public premiumAmount;
    uint256 public maxPayout;
    uint256 public poolDuration;
    uint256 public startTimestamp;
    uint256 public endTimestamp;

    // Policyholder tracking
    address[] public policyholders;
    mapping(address => bool) public isPolicyholder;
    mapping(address => uint256) public policyTokenId;
    uint256 public minPolicyholders;
    uint256 public maxPolicyholders;

    // Underwriter tracking
    address[] public underwriters;
    mapping(address => uint256) public underwriterDeposits;
    uint256 public totalUnderwriterDeposits;
    uint256 public underwriterMinDeposit;

    // Monitoring data
    MonitoringLog[] public monitoringHistory;
    struct MonitoringLog {
        uint256 timestamp;
        bytes rawValues;       // ABI-encoded values from each source
        uint256 consensusValue;
        string status;         // "MONITORING", "DATA_INSUFFICIENT", "FALSE_ALARM"
    }

    // Payout tracking
    bool public triggered;
    uint256 public triggerTimestamp;
    uint256 public totalPayoutAmount;
    uint256 public aiConfidence;

    // References
    address public policyNFT;
    address public underwriterVault;
}
```

**Key functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `purchasePolicy()` | Public (payable) | Policyholder sends `premiumAmount`. Mints PolicyNFT. Registers policyholder. Reverts if pool not ACTIVE or max policyholders reached. |
| `deposit()` | Public (payable) | Underwriter deposits liquidity. Must be >= `underwriterMinDeposit`. Tracked per underwriter. |
| `activatePool()` | Factory/CRE only | Transitions pool from FUNDING to ACTIVE when conditions met (min underwriter deposit, start time reached). |
| `logMonitoring(uint256 timestamp, bytes rawValues, uint256 consensusValue, string status)` | CRE only (via `onReport`) | Logs a monitoring tick. Called by the CRE monitoring workflow via ReceiverTemplate. |
| `processPayout(bytes rawValues, uint256 consensusValue, uint256 confidence, string reasoning)` | CRE only (via `onReport`) | Triggers payout to all policyholders. Calculates per-policyholder amount. Transfers funds. Updates PolicyNFT metadata. Sets state to SETTLED. |
| `flagForReview(bytes rawValues, uint256 consensusValue, uint256 confidence, string reasoning)` | CRE only (via `onReport`) | Flags pool for admin review (confidence 0.5-0.8). Optionally issues partial payout. |
| `logFalseAlarm(bytes rawValues, uint256 consensusValue, uint256 confidence, string reasoning)` | CRE only (via `onReport`) | Logs a false alarm (AI confidence < 0.5). Continues monitoring. |
| `expirePool()` | CRE only (via `onReport`) | Called at pool end date if not triggered. Returns underwriter deposits + premium share. Sets state to EXPIRED. |
| `pausePool(bytes32 reasonCode)` | Admin/CRE only | Pauses pool monitoring. Sets state to PAUSED. |
| `unpausePool()` | Admin only | Resumes pool monitoring. Sets state back to ACTIVE. |
| `getPoolStatus()` | View | Returns comprehensive pool status: state, policyholder count, underwriter total, time remaining, last monitoring values. |
| `getMonitoringHistory(uint256 count)` | View | Returns last N monitoring log entries. |
| `getTriggerConfig()` | View | Returns decoded trigger configuration. |

**The `onReport` function (ReceiverTemplate integration):**

```solidity
function onReport(bytes calldata report) internal override {
    // Decode the CRE workflow report
    (string memory action, bytes memory data) = abi.decode(report, (string, bytes));

    if (keccak256(bytes(action)) == keccak256("logMonitoring")) {
        (uint256 ts, bytes memory raw, uint256 cv, string memory status) =
            abi.decode(data, (uint256, bytes, uint256, string));
        _logMonitoring(ts, raw, cv, status);
    } else if (keccak256(bytes(action)) == keccak256("processPayout")) {
        (bytes memory raw, uint256 cv, uint256 conf, string memory reason) =
            abi.decode(data, (bytes, uint256, uint256, string));
        _processPayout(raw, cv, conf, reason);
    } else if (keccak256(bytes(action)) == keccak256("expirePool")) {
        _expirePool();
    }
    // ... other actions
}
```

**Events:**

```solidity
event PolicyPurchased(address indexed policyholder, uint256 tokenId, uint256 premium);
event UnderwriterDeposited(address indexed underwriter, uint256 amount);
event MonitoringLogged(uint256 timestamp, uint256 consensusValue, string status);
event PoolTriggered(uint256 timestamp, uint256 consensusValue, uint256 aiConfidence, uint256 totalPayout);
event PoolFlagged(uint256 timestamp, uint256 consensusValue, uint256 aiConfidence, string reasoning);
event FalseAlarmLogged(uint256 timestamp, uint256 consensusValue, uint256 aiConfidence);
event PoolExpired(uint256 timestamp, uint256 totalPremiums, uint256 underwriterReturns, uint256 protocolFee);
event PoolPaused(address admin, bytes32 reasonCode);
event PoolUnpaused(address admin);
event PayoutDistributed(address indexed policyholder, uint256 amount, uint256 tokenId);
```

### 5.3 PolicyNFT.sol

**Purpose:** ERC-721 token representing individual insurance policies. Each NFT encodes the full policy terms and is updated when the policy is triggered, expired, or refunded.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PolicyNFT is ERC721, ERC721URIStorage {
    uint256 private _nextTokenId;

    struct PolicyData {
        address pool;                // InsurancePool contract address
        uint256 premiumPaid;         // Premium amount deposited
        uint256 coverageAmount;      // Max payout amount
        uint256 purchaseTimestamp;   // When the policy was purchased
        uint256 expiryTimestamp;     // When the policy expires
        string triggerCondition;     // Human-readable trigger description
        PolicyStatus status;         // Current policy status
        uint256 payoutAmount;        // Amount received if triggered (0 if not)
        bytes32 payoutTxHash;        // Payout transaction hash (0 if not triggered)
    }

    enum PolicyStatus { ACTIVE, TRIGGERED, EXPIRED, REFUNDED }

    mapping(uint256 => PolicyData) public policies;
    mapping(address => uint256[]) public policiesByHolder;
}
```

**Key functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `mint(address to, PolicyData calldata data)` | Pool contract only | Mints a new PolicyNFT to the policyholder. Sets all policy metadata. Returns token ID. |
| `updateStatus(uint256 tokenId, PolicyStatus status, uint256 payoutAmount, bytes32 payoutTxHash)` | Pool contract only | Updates policy status after trigger, expiry, or refund. |
| `getPolicyData(uint256 tokenId)` | View | Returns full PolicyData struct for a given token. |
| `getPoliciesByHolder(address holder)` | View | Returns array of token IDs owned by a holder. |
| `tokenURI(uint256 tokenId)` | View | Returns on-chain generated metadata URI with policy terms, status, and visual representation. |

### 5.4 UnderwriterVault.sol

**Purpose:** Manages underwriter deposits across multiple pools. Tracks individual underwriter shares per pool. Distributes premium income to underwriters when pools expire without triggering.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract UnderwriterVault {
    struct UnderwriterPosition {
        uint256 deposited;           // Amount deposited
        uint256 sharePercentage;     // Percentage of pool's total underwriting (basis points)
        bool withdrawn;              // Whether the underwriter has withdrawn after pool resolution
    }

    // pool address => underwriter address => position
    mapping(address => mapping(address => UnderwriterPosition)) public positions;
    // pool address => total deposits
    mapping(address => uint256) public poolTotalDeposits;
    // pool address => underwriter addresses
    mapping(address => address[]) public poolUnderwriters;
    // underwriter address => pool addresses
    mapping(address => address[]) public underwriterPools;
}
```

**Key functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(address pool)` | Public (payable) | Deposit liquidity into a specific pool. Updates share percentages for all underwriters in the pool. |
| `withdraw(address pool)` | Underwriter only | Withdraw funds after pool is SETTLED or EXPIRED. If expired (no trigger): returns deposit + premium share. If settled (triggered): returns remaining balance (may be zero). |
| `getPosition(address pool, address underwriter)` | View | Returns the underwriter's position in a pool. |
| `getEstimatedYield(address pool, address underwriter)` | View | Returns estimated yield for an underwriter based on current premium accumulation and share percentage. |
| `getPoolUnderwriters(address pool)` | View | Returns all underwriter addresses for a pool. |
| `getUnderwriterPools(address underwriter)` | View | Returns all pools an underwriter has positions in. |
| `distributeReturns(address pool)` | Pool contract only | Called by InsurancePool.expirePool(). Calculates and distributes returns to all underwriters: deposit + (totalPremiums * sharePercentage) - protocolFee. |
| `lockForPayout(address pool)` | Pool contract only | Called by InsurancePool.processPayout(). Locks underwriter funds for policyholder payouts. |

---

## 6. ACE Compliance Policies

The Automated Compliance Engine (ACE) enforces regulatory and operational constraints on the protocol.

### 6.1 KYC for Large Payouts

| Policy | Detail |
|--------|--------|
| **Threshold** | Any single payout exceeding $10,000 USD equivalent requires verified KYC. |
| **Implementation** | Before payout distribution, the CRE workflow checks the policyholder's KYC status via an on-chain KYC registry. If KYC is not verified, the payout is held in escrow until KYC is completed. |
| **KYC provider** | Integrated via Thirdweb's identity/KYC module or a third-party KYC oracle. |
| **Escrow duration** | Payout is held for 30 days. If KYC is not completed within 30 days, the payout is returned to the pool and the policy is marked as "KYC_EXPIRED." |
| **Exemptions** | Payouts below $10,000 USD equivalent are exempt. |

### 6.2 Geographic Restrictions

| Policy | Detail |
|--------|--------|
| **Restricted jurisdictions** | Pools covering certain insurance types are restricted by jurisdiction. For example: crop insurance pools cannot accept policyholders from jurisdictions where parametric crop insurance is not recognized (varies by country). |
| **Implementation** | Pool creators specify allowed jurisdictions at pool creation. Policyholder jurisdiction is determined by IP geolocation at purchase time (logged but not blocking) and by self-attestation in the purchase flow. |
| **OFAC compliance** | Wallet addresses on the OFAC SDN list are blocked from all protocol interactions (pool creation, policy purchase, underwriting). Checked via on-chain blocklist updated by protocol governance. |
| **Data source restrictions** | Some data sources (NOAA, USGS) only cover certain geographic regions. Pools using these sources must restrict their coverage region accordingly. |

### 6.3 Rate Limiting

| Policy | Detail |
|--------|--------|
| **Policyholder rate limit** | A single wallet address can hold a maximum of 10 active policies across all pools. Prevents concentration of exposure. |
| **Pool purchase rate limit** | A single pool can accept a maximum of N policy purchases per hour (configurable, default 20). Prevents front-running when a trigger is imminent. |
| **Underwriter rate limit** | An underwriter cannot deposit more than 25% of a pool's total underwriting capacity. Prevents single-underwriter domination. |
| **Creation rate limit** | A single address can create a maximum of 5 pools per 24 hours. Prevents spam pool creation. |
| **Implementation** | All rate limits are enforced in the smart contracts via block-based timestamps and counters. |

### 6.4 Underwriter Minimum Requirements

| Policy | Detail |
|--------|--------|
| **Minimum deposit** | Each pool defines a `underwriterMinDeposit`. The pool cannot activate until total underwriter deposits meet or exceed the minimum. |
| **Minimum coverage ratio** | Total underwriter deposits must cover at least 100% of maximum potential payout (maxPayout * maxPolicyholders). This ensures every policyholder can be paid at full coverage. |
| **Lock period** | Once a pool is ACTIVE, underwriter deposits are locked until the pool is SETTLED or EXPIRED. Early withdrawal is not permitted. |
| **Diversification** | Protocol-level guidance (not enforced on-chain): underwriters are advised to diversify across pool types and regions. The frontend displays concentration warnings. |

### 6.5 Premium Pricing Guardrails

| Policy | Detail |
|--------|--------|
| **Minimum premium** | Pools must set a premium of at least 0.001 ETH to prevent dust attacks. |
| **Maximum payout ratio** | Max payout cannot exceed 100x the premium (prevents unrealistic coverage). |
| **Protocol fee** | A percentage of each premium (configurable, default 2.5%) is routed to the Surely treasury. Deducted at pool expiry or trigger settlement. |

---

## 7. Frontend Pages

### 7.1 Explore Pools

**URL:** `/pools`

**What the user sees:**

- Grid/list view of all active insurance pools.
- Filter controls: pool type (weather, flight, seismic, crypto, fire), region (map selector or text), premium range (slider), pool duration (slider), status (funding, active, expiring soon).
- Each pool card displays:
  - Pool type icon and name (e.g., "Crop Drought -- Central Valley, CA").
  - Trigger condition in plain English (e.g., "Pays out if rainfall drops below 50mm in 30 days").
  - Premium amount and max payout.
  - Time remaining (progress bar).
  - Policyholder count (e.g., "23/100 policies sold").
  - Underwriter coverage ratio (e.g., "Fully funded" or "87% funded").
  - Last monitoring reading (e.g., "Current rainfall: 68mm -- 18mm above threshold").
- Clicking a pool card navigates to the Pool Detail page.
- "Create Pool" button in the header for pool creators.

**What the user does:**

- Browse pools by category and region.
- Compare premium-to-payout ratios across similar pools.
- Identify pools nearing their trigger threshold (high-interest pools for underwriters to avoid or policyholders to buy).
- Purchase a policy by clicking "Get Covered" on a pool card and confirming the transaction.

### 7.2 Create Pool

**URL:** `/pools/create`

**What the user sees:**

- Multi-step wizard form (5 steps):

**Step 1: Pool Type**
- Select from predefined pool types: Crop Drought, Flight Delay, Earthquake, Stablecoin Depeg, Extreme Temperature, Flood, Wildfire, Crypto Crash, Custom.
- Selecting a predefined type pre-fills recommended data sources, field paths, and verification frequency.
- "Custom" allows full manual configuration.

**Step 2: Trigger Condition**
- Define the trigger threshold (e.g., "Rainfall below [___] mm over [___] days").
- For predefined types, the form provides guided inputs specific to the trigger type.
- For custom types, a condition builder (threshold value, comparison operator, duration requirement).

**Step 3: Data Sources**
- Add 2-3 data source URLs.
- For each source: URL, API key (stored encrypted), JSON field path to extract.
- "Test" button validates each source returns data and the field path resolves.
- Pre-filled suggestions for predefined pool types.

**Step 4: Financial Parameters**
- Premium amount (ETH).
- Max payout per policyholder (ETH).
- Pool duration (days).
- Min/max policyholders.
- Underwriter minimum deposit.
- Verification frequency (dropdown: every 5 min, 15 min, 30 min, 1 hour, 6 hours, daily).

**Step 5: Review and Deploy**
- Full summary of all parameters.
- Estimated gas cost for deployment.
- Creation fee displayed.
- "Deploy Pool" button -- submits transaction to SurelyFactory.

**What the user does:**

- Define a new insurance pool with custom trigger conditions.
- Test data sources before deployment to ensure they return expected data.
- Review all parameters before committing the creation fee and gas.

### 7.3 My Policies

**URL:** `/policies`

**What the user sees:**

- List of all PolicyNFTs owned by the connected wallet.
- Each policy card displays:
  - Pool name and type.
  - Policy status (Active, Triggered, Expired, Refunded) with color coding.
  - Premium paid and coverage amount.
  - Purchase date and expiry date.
  - Current monitoring status (latest reading vs threshold).
  - If triggered: payout amount received and transaction hash (link to explorer).
- Filter by status (active, triggered, expired).
- Sort by expiry date, purchase date, or payout amount.

**What the user does:**

- Monitor active policies and track how close the trigger is to firing.
- View payout history for triggered policies.
- Transfer (sell) active policies to other addresses via standard NFT transfer.

### 7.4 Underwrite

**URL:** `/underwrite`

**What the user sees:**

- List of all pools accepting underwriter deposits (state: FUNDING or ACTIVE with room for more underwriters).
- Each pool card displays:
  - Pool name, type, and trigger condition.
  - Current underwriter coverage ratio.
  - Estimated yield if pool expires without triggering (APY equivalent).
  - Historical trigger frequency for this pool type/region (e.g., "Drought has triggered 2 of the last 10 seasons in this region").
  - Risk rating (Low / Medium / High) based on historical data and current conditions.
  - Number of policyholders (indicates demand).
- "Deposit" button opens a deposit modal with amount input and confirmation.
- Portfolio view: shows all pools the underwriter has positions in, with aggregate yield estimates, total deposits at risk, and portfolio risk score.

**What the user does:**

- Evaluate pool risk/reward before depositing liquidity.
- Deposit into multiple pools to diversify exposure.
- Track portfolio performance and estimated returns.
- Withdraw after pool resolution (expiry or settlement).

### 7.5 Pool Detail

**URL:** `/pools/:address`

**What the user sees:**

- **Header:** Pool name, type, status badge, time remaining countdown.
- **Monitoring Dashboard:**
  - Real-time chart of monitored values vs trigger threshold (line chart with threshold as horizontal line).
  - Last data fetch timestamp and values from each source.
  - Consensus value displayed prominently.
  - Distance to trigger (e.g., "Current rainfall: 68mm -- 18mm above the 50mm threshold").
- **Pool Information:**
  - Trigger condition (human-readable).
  - Data sources (with last-check status: green/red).
  - Verification frequency.
  - Premium and max payout.
  - Pool duration and remaining time.
- **Participants:**
  - Policyholder count and list (anonymized addresses).
  - Underwriter count and total deposits.
  - Coverage ratio visualization.
- **Monitoring History:**
  - Table of all monitoring log entries: timestamp, values per source, consensus value, status.
  - Expandable rows showing raw data from each source.
- **Actions:**
  - "Purchase Policy" button (if pool is ACTIVE and not full).
  - "Deposit as Underwriter" button (if accepting deposits).
  - "Pause Pool" button (admin only).

**What the user does:**

- Monitor the real-time status of a specific pool.
- Review historical monitoring data for transparency.
- Make informed decisions about purchasing policies or underwriting.

### 7.6 Admin Panel

**URL:** `/admin`

**What the user sees:**

- **Pool Management:**
  - List of all pools created by the connected wallet (or all pools if protocol admin).
  - Status of each pool with quick actions: pause, unpause, view details.
- **Emergency Controls:**
  - "Pause Pool" button with reason code selection dropdown.
  - "Unpause Pool" button (only for paused pools).
  - "Emergency Settle" -- force-settle a pool with admin override (requires multi-sig in production).
- **Protocol Stats (protocol admin only):**
  - Total pools created, active, settled, expired.
  - Total premiums collected, total payouts distributed.
  - Protocol fee revenue.
  - Active policyholders and underwriters.
- **CRE Workflow Status:**
  - List of all registered monitoring workflows with their last execution timestamp and status.
  - Alerts for failed workflows or data source outages.

**What the user does:**

- Manage pools they have created (pause/unpause, view performance).
- Handle emergency situations (data source outage, suspected manipulation).
- Monitor protocol health and revenue (protocol admin).

---

## 8. External Integrations

### 8.1 Weather Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **OpenWeatherMap** | `api.openweathermap.org/data/3.0/onecall` | Temperature, rainfall, humidity, wind speed, historical data | 1,000 calls/day | Primary weather source for all weather-type pools |
| **WeatherAPI** | `api.weatherapi.com/v1/history.json` | Temperature, precipitation, forecast, historical | 1M calls/month | Secondary weather source for cross-verification |
| **NOAA Climate Data Online** | `www.ncdc.noaa.gov/cdo-web/api/v2/data` | Official US climate records, station data, historical | Unlimited (with token) | Tertiary source for US-based weather pools |

### 8.2 Flight Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **AviationStack** | `api.aviationstack.com/v1/flights` | Real-time flight status, delay, arrival/departure | 500 calls/month | Primary flight data source |
| **FlightAware AeroAPI** | `aeroapi.flightaware.com/aeroapi/flights` | Flight tracking, delay, cancellation, diversions | 15 lookups/month (free tier limited) | Secondary flight source with high accuracy |
| **FlightsLogic** | `api.flightslogic.com/v1/status` | Flight status, delay minutes, gate info | Varies | Tertiary source for consensus |

### 8.3 Seismic Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **USGS Earthquake Hazards** | `earthquake.usgs.gov/fdsnws/event/1/query` | Magnitude, location, depth, time (global) | Unlimited | Primary seismic source (global coverage) |
| **EMSC** | `www.seismicportal.eu/fdsnws/event/1/query` | European-Mediterranean seismic data | Unlimited | Secondary source, strong Euro-Med coverage |
| **GeoNet** | `api.geonet.org.nz/quake` | New Zealand seismic (also relays global data) | Unlimited | Tertiary source for global coverage |

### 8.4 Crypto Price Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **CoinGecko** | `api.coingecko.com/api/v3/simple/price` | Token prices, market data, 24h changes | 10-50 calls/min | Primary crypto price source |
| **Chainlink Price Feeds** | On-chain (EVM Read) | Decentralized oracle price feeds | Free (on-chain) | Secondary source, highest trust (decentralized) |
| **CoinMarketCap** | `pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest` | Token prices, market cap, volume | 10,000 calls/month | Tertiary source for cross-verification |

### 8.5 River / Flood Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **USGS NWIS** | `waterservices.usgs.gov/nwis/iv` | Real-time river gauge levels, discharge, US-wide | Unlimited | Primary flood source (US coverage) |
| **NOAA NWS River Forecasts** | `api.weather.gov/alerts` (flood type) | River forecasts, flood warnings, observed levels | Unlimited | Secondary source for US rivers |
| **EFAS** | `www.efas.eu/api` | European river discharge, flood forecasts | Research access | Tertiary source for European flood pools |

### 8.6 Wildfire / Satellite Data

| Service | API Endpoint | Data Provided | Free Tier | Use Case |
|---------|-------------|---------------|-----------|----------|
| **NASA FIRMS** | `firms.modaps.eosdis.nasa.gov/api/area/csv` | MODIS/VIIRS satellite fire detections, confidence scores | Unlimited | Primary wildfire detection source |
| **NOAA HMS** | `satepsanone.nesdis.noaa.gov/pub/FIRE/HMS` | Hazard Mapping System fire/smoke analysis | Public access | Secondary source for fire verification |
| **Copernicus EMS** | `effis.jrc.ec.europa.eu/api` | European Forest Fire Information System | Research access | Tertiary source, strong European coverage |

### 8.7 AI Adjudication

| Service | API Endpoint | Purpose | Notes |
|---------|-------------|---------|-------|
| **Google Gemini** | `generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent` | Edge case adjudication, data quality assessment, confidence scoring | Called inside TEE. Structured JSON output mode. Deterministic across DON nodes when using same prompt. |

### 8.8 Web3 Infrastructure

| Service | Purpose | Notes |
|---------|---------|-------|
| **Thirdweb Connect** | Wallet connection (email, social, WalletConnect) | Gas sponsorship via Thirdweb Engine for policy purchases (reduce friction). ERC-4337 account abstraction for gasless onboarding. |
| **Chainlink CRE** | Workflow engine for all monitoring, adjudication, and payout automation | Cron triggers, HTTP Client, EVM Read/Write, Consensus, TEE for AI calls. |
| **Avalanche Fuji** | Target deployment chain (testnet) | Low gas costs, Coinbase ecosystem, good for hackathon demo. |

---

## 9. Hackathon Demo Flow (5-Minute Timed Script)

### Setup (before demo)

- Deploy SurelyFactory and PolicyNFT contracts to Avalanche Fuji.
- Pre-fund a demo wallet with testnet ETH.
- Pre-create one "Crypto Crash" pool (BTC > 20% drop in 24h) with underwriter funding already deposited. Pool is ACTIVE with monitoring running.
- Pre-populate 5-10 monitoring log entries showing recent BTC price checks (all stable, no trigger).
- Have a second pool in FUNDING state (Weather Drought) ready to show the creation flow.

### Demo Script

**[0:00 - 0:30] Problem Statement (30 seconds)**

"Insurance is broken. 40-60% of every premium dollar goes to overhead. Claims take weeks or months. The process is adversarial. Parametric insurance fixes this by paying out on objective data, but it has three unsolved problems: who provides the data, who executes the payout, and who handles edge cases. Surely solves all three with Chainlink CRE."

**[0:30 - 1:30] Product Walkthrough -- Explore Pools (60 seconds)**

- Open the app. Show the Explore Pools page with multiple pool types visible.
- Click into the active Crypto Crash pool. Show the Pool Detail page:
  - Real-time monitoring chart showing BTC price vs the 20% drop threshold.
  - Last monitoring values from CoinGecko, Chainlink, and Binance.
  - Consensus value and distance to trigger.
  - Policyholder count and underwriter coverage.
- "This pool has been monitoring BTC price every 10 minutes across three independent sources, reaching DON consensus on every reading. If BTC drops more than 20% in 24 hours, every policyholder gets paid instantly."

**[1:30 - 2:30] Purchase a Policy (60 seconds)**

- Click "Get Covered" on the Crypto Crash pool.
- Connect wallet via Thirdweb (show email login -- no crypto knowledge needed).
- Confirm the premium deposit transaction (gas sponsored via Thirdweb Engine).
- Show the PolicyNFT appearing in the My Policies page.
- "I just bought downside protection for 0.01 ETH. If BTC crashes 20% in the next 30 days, I automatically receive 0.1 ETH. No claim to file. No adjuster. No waiting."

**[2:30 - 3:30] CRE Architecture Deep Dive (60 seconds)**

- Switch to a slide or diagram showing the CRE workflow architecture.
- Walk through Workflow 2 (Trigger Monitoring):
  - "Every 10 minutes, a CRE cron workflow fires. It fetches BTC price from three sources. DON nodes reach consensus on the value. If the price hasn't dropped 20%, it logs the reading on-chain and waits for the next tick."
- Walk through Workflow 3 (Trigger Resolution):
  - "When the threshold is crossed, the workflow invokes Gemini AI inside the TEE to adjudicate. Is this a real crash or a flash crash on one exchange? The AI scores confidence. Above 0.8, payouts go out automatically."
- "The entire flow -- data fetching, consensus, AI adjudication, payout execution -- happens autonomously inside CRE. No human in the loop."

**[3:30 - 4:15] Create a Pool (45 seconds)**

- Navigate to Create Pool. Quickly walk through the wizard:
  - Select "Crop Drought" pool type (pre-filled data sources appear).
  - Set threshold: "Rainfall below 50mm over 30 days."
  - Show the 3 weather data sources pre-configured.
  - Set premium (0.02 ETH), max payout (0.5 ETH), duration (90 days).
  - Click "Deploy Pool" (show transaction confirmation).
- "Anyone can create an insurance pool. Define the trigger, pick your data sources, set the economics. CRE handles everything else."

**[4:15 - 5:00] Business Case and Vision (45 seconds)**

- "Surely turns insurance into a protocol. No claims. No adjusters. No middlemen. Just data, consensus, and automatic payouts."
- "The parametric insurance market is growing 20%+ year over year. We take a 2.5% protocol fee on premiums. Underwriters earn yield by providing liquidity."
- "Today we showed crypto crash and crop drought pools. The same architecture works for flight delays, earthquakes, floods, wildfires -- any risk with a measurable data source."
- "Built on CRE: cron workflows for monitoring, multi-source consensus for data integrity, AI inside TEE for edge case adjudication, and EVM write for instant payouts. This is what decentralized insurance should look like."

---

## 10. Business Model

### Revenue Streams

| Revenue Stream | Mechanism | Estimated Revenue |
|---------------|-----------|-------------------|
| **Protocol fee on premiums** | 2.5% of every premium paid by policyholders. Deducted at pool settlement or expiry. | If $10M in premiums flow through the protocol annually: $250K/year. |
| **Pool creation fee** | Flat fee (0.01-0.05 ETH) charged when a new pool is deployed. Covers deployment gas + protocol overhead. | At 1,000 pools/year and 0.02 ETH avg fee: ~$50K/year (at $2,500/ETH). |
| **Enterprise API** | Whitelabel parametric insurance engine for traditional insurers, reinsurers, and enterprise platforms. Licensed via annual subscription. | Enterprise licenses: $50K-500K/year per customer. |
| **Reinsurance marketplace** | Connect underwriters across pools. Pools with excess risk can offload to reinsurance pools (pool-of-pools). Protocol takes a matching fee. | 0.5% matching fee on reinsurance flows. |

### Unit Economics

| Metric | Value |
|--------|-------|
| **Cost per pool deployment** | Gas cost on Base: ~$0.50-2.00. Creation fee covers this 10-20x. |
| **Cost per monitoring tick** | CRE workflow execution: covered by LINK staking/subscription model. HTTP Client calls: free tier data sources (0 cost for weather, seismic, flight data). |
| **Cost per payout** | Gas cost for multi-transfer: ~$1-5 on Base (depending on policyholder count). Covered by pool fee reserve. |
| **Breakeven** | Protocol is profitable after ~$5M annual premium volume (given 2.5% fee = $125K, covering infrastructure + team). |

### Growth Flywheel

1. More pool types attract more policyholders.
2. More policyholders generate more premiums.
3. More premiums attract more underwriters (yield opportunity).
4. More underwriters increase pool coverage ratios, making pools more attractive.
5. More successful payouts build trust, attracting more policyholders.
6. Higher volume reduces per-unit costs (gas amortization, API tier upgrades).

---

## 11. Technical Hackathon Scope

### What to Actually Build (Realistic for 2-4 Week Hackathon)

The full Surely vision includes 8 pool types, 5 CRE workflows, 4 smart contracts, and a full frontend. For the hackathon, we build a focused vertical slice that demonstrates the core value proposition end-to-end.

### Smart Contracts (Build 2)

| Contract | Scope | Notes |
|----------|-------|-------|
| **SurelyFactory.sol** | Full implementation. Pool creation, registry, fee collection. Simple version (no upgradability). | ~200 lines. Straightforward factory pattern. |
| **InsurancePool.sol** | Full lifecycle: funding -> active -> settled/expired. Inherits ReceiverTemplate. Supports policyholder deposits, payout distribution, monitoring logs, pool expiry. | ~400 lines. The core contract. |
| **PolicyNFT.sol** | Simplified. Mint on policy purchase. Update status on trigger/expiry. Basic on-chain metadata (no dynamic SVG rendering). | ~100 lines. Standard ERC-721 with custom struct. |
| **UnderwriterVault.sol** | Deferred to post-hackathon. Underwriter deposits go directly into the InsurancePool contract for the hackathon version. | Simplifies the architecture significantly. |

### CRE Workflows (Build 3)

| Workflow | Scope | Priority |
|----------|-------|----------|
| **Workflow 2: Trigger Monitoring** | Full implementation. Cron trigger, 2-3 HTTP Client fetches, consensus, EVM Read/Write. This is the core demo. | **P0 -- Must have.** |
| **Workflow 3: Trigger Resolution + Payout** | Full implementation. AI adjudication via Gemini, confidence scoring, automatic payout execution. | **P0 -- Must have.** |
| **Workflow 4: Pool Expiry** | Simplified. Cron trigger at end date, return funds to underwriters/policyholders. | **P1 -- Should have.** |
| **Workflow 1: Pool Creation** | Deferred. Pool creation happens via direct frontend-to-contract calls (no CRE workflow needed for MVP). | **P2 -- Nice to have.** |
| **Workflow 5: Emergency Override** | Deferred. Admin can pause pools via direct contract calls for MVP. | **P2 -- Nice to have.** |

### Pool Types (Implement 2-3)

| Pool Type | Data Sources | Why This One |
|-----------|-------------|--------------|
| **Crypto Crash (BTC -20% in 24h)** | CoinGecko + Chainlink Price Feeds + Binance | Easiest to demo. Data sources are fast, free, and highly reliable. Can simulate trigger by using a volatile testnet token or mock data source. Judges understand crypto volatility. |
| **Stablecoin Depeg (USDC < $0.95 for 1h)** | CoinGecko + Chainlink + CoinMarketCap | Same data infrastructure as Crypto Crash. Different trigger logic (sustained duration vs. point-in-time). Shows workflow flexibility. |
| **Weather Drought (rainfall < 50mm in 30 days)** | OpenWeatherMap + WeatherAPI + NOAA | Demonstrates real-world data integration beyond crypto. Compelling use case for judges (climate risk, agriculture). Longer monitoring cycle -- pre-populate historical data for demo. |

### Frontend Pages (Build 4)

| Page | Scope | Priority |
|------|-------|----------|
| **Explore Pools** | Grid view with filters. Pool cards with key metrics. Link to Pool Detail. | **P0** |
| **Pool Detail** | Monitoring chart, live values vs threshold, participant counts, monitoring history table, "Purchase Policy" button. | **P0** |
| **My Policies** | List of PolicyNFTs with status, premium, payout. | **P1** |
| **Create Pool** | Simplified wizard (2-3 steps for predefined pool types). | **P1** |
| **Underwrite** | Deferred. Underwriter deposits happen via contract interaction / Etherscan for hackathon. | **P2** |
| **Admin** | Deferred. Admin actions via contract interaction for hackathon. | **P2** |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart contracts** | Solidity 0.8.24, Foundry (forge build/test/deploy), OpenZeppelin (ERC-721), Chainlink CRE ReceiverTemplate |
| **CRE workflows** | TypeScript, @cre/sdk, deployed to Chainlink DON |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Wallet** | Thirdweb Connect (email/social + WalletConnect) |
| **Chain** | Avalanche Fuji (testnet) |
| **Data viz** | Recharts or Tremor (for monitoring charts) |

### Development Timeline (2-4 Weeks)

| Week | Focus | Deliverables |
|------|-------|-------------|
| **Week 1** | Smart contracts + CRE workflow skeleton | SurelyFactory.sol, InsurancePool.sol deployed to Avalanche Fuji. PolicyNFT.sol minting. CRE Workflow 2 (monitoring) fetching from CoinGecko + Chainlink with cron trigger. |
| **Week 2** | CRE workflows complete + AI adjudication | Workflow 3 (resolution + payout) with Gemini integration. Workflow 4 (pool expiry). End-to-end trigger -> payout flow working on testnet. |
| **Week 3** | Frontend + integration | Explore Pools, Pool Detail (with live monitoring chart), My Policies, Create Pool pages. Thirdweb Connect integration. Gas sponsorship. |
| **Week 4** | Polish + demo prep | Pre-populate demo data. Record demo video. Write submission docs. Test edge cases (data source outage, borderline triggers). Rehearse 5-minute demo. |

### What is NOT in Hackathon Scope

- UnderwriterVault contract (underwriter deposits go directly to InsurancePool).
- Cross-chain support (single chain: Avalanche Fuji).
- KYC integration (all payouts go through without KYC check).
- Geographic restrictions (no geo-fencing in MVP).
- Dynamic SVG rendering for PolicyNFTs (basic metadata only).
- Production data source API keys (use free tiers with rate limiting).
- Multi-sig admin controls (single admin address for hackathon).
- Mobile responsive design (desktop-first for demo).

---

## 13. Avalanche Build Games Integration

### Why Avalanche

Surely is being submitted to the Avalanche Build Games in addition to Chainlink Convergence. Avalanche is a natural fit for the protocol:

| Reason | Detail |
|--------|--------|
| **EVM-compatible C-Chain** | Zero migration cost — Surely contracts deploy to Avalanche C-Chain with no code changes. Same Solidity, same ABI, same tooling. |
| **Sub-second finality** | Avalanche's ~1s finality means claim payouts settle in seconds, not minutes. For a protocol where "instant payout" is the core value proposition, finality speed is directly user-facing. Compared to ~12s on Ethereum mainnet, this is a 12x improvement in payout confirmation time. |
| **Low gas costs on C-Chain** | ACP-125 reduced C-Chain base fee by 25x. For Surely, this matters in two ways: (1) micro-claims are economically viable (low-premium, low-payout pools that would be gas-unprofitable on Ethereum are viable on Avalanche), and (2) high-volume claim processing — when a trigger fires across 100 policyholders, 100 payout transactions need to execute, and low gas makes this feasible at scale. |
| **Future L1 path** | Avalanche's L1 architecture gives Surely a credible path to an insurance-specific chain. See details below. |

### Future: Surely L1 on Avalanche

The long-term vision is a purpose-built insurance chain using Avalanche's L1 infrastructure:

- **eERC for encrypted claim data**: Medical records, damage assessments, and sensitive claim details stored as encrypted values on-chain. Only authorized parties (insurer, policyholder, regulator) can decrypt. Solves the core privacy problem that has prevented on-chain insurance at scale.
- **validatorOnly mode**: Insurance industry validators only (licensed insurers, reinsurers, regulatory nodes). This enables regulatory compliance without sacrificing decentralization — the chain is permissioned at the validator level, not the smart contract level.
- **Custom precompile for claim verification logic**: High-throughput claim verification (signature checks, policy term validation, trigger condition evaluation) moved to a native precompile for deterministic, gas-efficient execution.

### Partner Integrations

#### Chainlink CRE (already core to Surely)

CRE is the backbone of Surely's claim processing pipeline. All five CRE capabilities are active:

| CRE Capability | Surely Usage |
|----------------|----------------|
| **Confidential HTTP (TEE)** | Processing sensitive claim data (medical records, damage reports) inside the enclave — data never leaves the TEE unencrypted |
| **Consensus** | Multi-node claim assessment validation — DON nodes independently assess the claim trigger, then reach consensus. No single node can manipulate a payout. |
| **Cron Trigger** | Periodic claim status checks — monitoring pools every N seconds, checking trigger conditions on schedule |
| **Log Trigger** | Real-time claim event monitoring — reacting immediately when a ClaimFiled or PolicyPurchased event fires on-chain |
| **CCIP** | Cross-chain claim settlement — policyholder on Avalanche, claim settled to their wallet on any supported chain |

#### Kite AI (removed) — Verifiable AI Claims Agent Identity

Kite AI (removed) provides Proof of Attributed Intelligence for Surely's AI claims processing agents. Every AI assessment carries a verifiable identity trail.

**What this means for policyholders:** Instead of "an AI denied your claim," policyholders see:

> "Your claim was assessed by ClaimBot v3.2 — 94.7% accuracy across 12,000 claims. Last model update: 14 days ago. Assessment: trigger threshold not met (rainfall 52mm vs 50mm threshold, 99th percentile confidence)."

This is verifiable, not just marketing. Kite AI (removed)'s attribution system allows anyone to check:
- Which AI model version processed their claim
- The model's historical accuracy rate across all past claims
- Whether the model has been updated since the assessment (and if so, would the new model reach a different conclusion)
- The full attribution chain from raw data to final decision

**Why this matters:** AI-driven claim denials are a regulatory and reputational risk. Kite AI (removed)'s attribution turns an opaque system into an auditable one — making Surely defensible to regulators and trustworthy to policyholders.

#### CZUSD — Stablecoin Payouts and Pool Yield

All claim payouts are denominated and settled in CZUSD (Agora's USD stablecoin). This solves two problems simultaneously:

**1. Payout stability:** A policyholder who files a crop damage claim does not want to receive a payout in volatile ETH. CZUSD ensures the payout amount is what they expected when they purchased the policy.

**2. Pool yield on idle reserves:** Insurance pools hold premium capital between the policy purchase date and payout (or expiry). On Ethereum, this capital sits idle. On Avalanche with Agora:

- Premiums collected in CZUSD are deposited into the insurance pool on C-Chain
- Idle reserves earn CZUSD yield (Treasury-backed, approximately 4-5% APY)
- When a trigger fires, the payout comes from pool reserves (which have been earning yield)
- When a pool expires without triggering, policyholders can claim a partial premium refund (funded in part by the yield earned)
- CRE Cron monitors pool reserve levels and triggers rebalancing if reserves fall below the minimum coverage threshold

This creates a sustainable pool economics model: underwriters earn yield on their deployed capital while it waits to pay claims.

#### Tether WDK (removed) — Self-Custodial Policyholder Wallets

Tether's Wallet Development Kit provides self-custodial wallets for policyholders. Claim payouts go directly to the policyholder's wallet — no intermediary, no bank delays, no withdrawal friction.

- **Multi-chain support**: Policyholders can receive CZUSD payouts on any chain Tether WDK (removed) supports — not just the chain the pool is deployed on
- **No intermediary**: The payout path is smart contract → policyholder wallet, with no custodian in between
- **Self-custodial**: Policyholders hold their own keys — no platform risk if Surely shuts down
- **Familiar UX**: Tether WDK (removed)'s wallet UI is familiar to users already using USDT — lower onboarding friction

### Avalanche-Specific Architecture

```
Policyholder → Files claim / triggers on Avalanche C-Chain
             ↓
CRE TEE: AI (Gemini) processes claim data confidentially
         - Sensitive data (medical records, damage reports) never leaves enclave
         - Kite AI (removed) attribution: model identity + accuracy record attached to assessment
             ↓
CRE Consensus: Multiple DON nodes validate claim assessment
         - Independent evaluation across nodes
         - Byzantine fault tolerance — no single node can force a payout
             ↓
Smart Contract: Auto-approve / deny based on policy rules + consensus result
         - Trigger met → immediate payout authorization
         - Trigger not met → monitoring continues or pool expires
             ↓
CZUSD: Instant stablecoin payout to policyholder's Tether WDK (removed) wallet
         - No volatility, no bank delays, no intermediary
         - CRE CCIP: cross-chain delivery if policyholder is on a different chain

Insurance Pool Economics:
- Premiums collected in CZUSD → pooled on C-Chain
- Idle reserves → CZUSD yield (~4-5% APY, Treasury-backed)
- Claims paid from pool → instant CZUSD settlement
- CRE Cron → monitors pool health, triggers rebalancing if needed

Future Surely L1:
- eERC encrypted claims → medical records / damage data stored encrypted on-chain
- validatorOnly mode → insurance-industry validators (regulatory compliance)
- Custom precompile → high-throughput claim verification logic
```

### Insurance Pool Economics on Avalanche

| Flow | Detail |
|------|--------|
| **Premium collection** | Policyholders pay premiums in CZUSD when purchasing a policy |
| **Reserve deployment** | Pool reserves deposited into CZUSD yield vault — earning ~4-5% APY on idle capital |
| **Claim payout** | When trigger fires, CZUSD is withdrawn from reserves and sent directly to policyholder wallets via Tether WDK (removed) |
| **Pool expiry (no trigger)** | Underwriters receive their capital + yield earned. Policyholders can receive a partial premium refund. |
| **Pool health monitoring** | CRE Cron workflow checks reserve levels against outstanding coverage obligations — triggers rebalancing if reserves drop below minimum coverage ratio |

This creates aligned incentives: underwriters are rewarded for providing liquidity (yield + return of capital if no trigger), policyholders benefit from stable CZUSD payouts, and the protocol earns fees on both premium flow and yield generation.

### Build Games Judging Alignment

| Criterion | Surely Angle |
|-----------|----------------|
| **Builder Drive** | Insurance + AI + crypto is a genuinely novel category. Very few teams are working at the intersection of parametric insurance, CRE TEE adjudication, and on-chain pool economics. The "boring industry + exciting tech" angle stands out from pure DeFi or NFT submissions. |
| **Execution** | Full claims lifecycle automated — submit, process (TEE), verify (Consensus), pay (CZUSD). Not a prototype — a working end-to-end system. |
| **Crypto Culture** | Transparent claim processing (every assessment logged on-chain, verifiable audit trail), AI accountability via Kite AI (removed) (no black-box denials), policyholder sovereignty via Tether WDK (removed) (you hold your own payout). |
| **Long-Term Intent** | Clear roadmap to a production insurance product and eventually a purpose-built Avalanche L1 with eERC encrypted claim data and insurance-industry validators. |

---

## 14. Build Games Demo Angle

### The Pitch in One Line

"File a claim. AI processes it in seconds. Get paid instantly."

### The Demo Flow

1. **Policyholder files a claim** — on Avalanche C-Chain, one transaction, submitting the claim event (trigger condition met)
2. **CRE TEE processes the claim** — AI (Gemini) assesses the claim data inside the enclave. Show the attestation: data entered TEE, AI model assessed, result signed by enclave. Kite AI (removed) panel shows: which model version ran, its accuracy record, the attribution proof.
3. **CRE Consensus validates** — DON nodes independently evaluated the same claim. Show the consensus result: 5/7 nodes agreed, threshold met, payout authorized.
4. **CZUSD payout to wallet** — Tether WDK (removed) wallet receives CZUSD. Show the transaction: smart contract → policyholder wallet, confirmed in ~1s on Avalanche. No waiting. No bank. No intermediary.
5. **Kite AI (removed) agent track record** — Pull up the ClaimBot dashboard: 12,000 claims assessed, 94.7% accuracy, full attribution chain for every decision. This is the AI accountability layer.

### Why This Stands Out

Nobody else is combining:
- Insurance (real-world utility, massive TAM)
- AI claim adjudication inside CRE TEE (confidential + verifiable)
- Stablecoin payouts in CZUSD (no volatility risk for policyholders)
- Self-custodial wallets via Tether WDK (removed) (true ownership of payouts)
- Verifiable AI identity via Kite AI (removed) (accountability, not just automation)
- Avalanche C-Chain (sub-second finality, low gas for micro-claims)

The "boring industry + exciting tech" angle is a deliberate strategic choice. Insurance is a $6.3 trillion market that has barely been touched by crypto. Surely is not trying to build the 50th DEX or the 100th NFT marketplace. It is trying to fix something that is genuinely broken and that affects billions of people.

---

## 12. Tracks and Prizes

### Primary Track: DeFi

**Why DeFi:** Surely is a financial protocol at its core. Insurance pools are liquidity pools. Underwriters earn yield. Policyholders get coverage. The premium-to-payout ratio is a financial product. The protocol fee model is DeFi-native.

**DeFi track alignment:**

| Criterion | Surely Alignment |
|-----------|-------------------|
| Novel financial primitive | Parametric insurance pools as composable DeFi building blocks. PolicyNFTs as tradeable financial instruments. Underwriter yield from risk-taking. |
| On-chain execution | All pool lifecycle events (creation, policy purchase, monitoring, payout, expiry) happen on-chain via CRE -> EVM Write. |
| Liquidity mechanics | Two-sided market: policyholders deposit premiums, underwriters provide liquidity. Pool economics create natural price discovery for risk. |
| Composability | PolicyNFTs can be used as collateral in other DeFi protocols. Insurance pools can be referenced by other contracts (e.g., lending protocols that require borrowers to hold crop insurance). |

### Secondary Track: AI

**Why AI:** The AI adjudication system is a core differentiator, not a bolted-on feature. Without AI adjudication, parametric insurance cannot handle edge cases, and edge cases are where most disputes occur in traditional insurance.

**AI track alignment:**

| Criterion | Surely Alignment |
|-----------|-------------------|
| AI integration depth | AI (Gemini) is integrated into the core trigger resolution workflow, not a separate feature. Every borderline trigger passes through AI adjudication. |
| TEE execution | AI calls happen inside the TEE, ensuring deterministic adjudication across DON nodes and privacy of the data context. |
| Structured output | AI returns structured JSON with confidence scores, reasoning, data quality assessment, and anomaly detection -- not just text. |
| Decision impact | AI confidence score directly determines payout behavior (full payout, partial payout, or continued monitoring). The AI is a decision-maker, not an advisor. |

### Secondary Track: Real-World Data

**Why Real-World Data:** Surely is fundamentally about bridging real-world data to on-chain financial outcomes. The multi-source data verification and CRE monitoring architecture is the technical core.

**Real-World Data track alignment:**

| Criterion | Surely Alignment |
|-----------|-------------------|
| Data source diversity | 15+ external APIs across weather (OWM, WeatherAPI, NOAA), aviation (AviationStack, FlightAware), seismic (USGS, EMSC), crypto (CoinGecko, Chainlink, Binance), hydrology (USGS NWIS), and satellite (NASA FIRMS). |
| Data verification | Multi-source consensus (byMedian, byFields, byMajority) ensures no single source can manipulate trigger outcomes. |
| CRE utilization | Full use of CRE capabilities: Cron Trigger (monitoring), HTTP Client (data fetching), Consensus (multi-source agreement), EVM Read/Write (on-chain state), HTTP Client inside TEE (AI adjudication). |
| Real-world impact | Parametric insurance directly addresses climate risk (crop drought, flood, wildfire, extreme temperature), travel disruption (flight delay), and financial risk (crypto crash, stablecoin depeg). |

### Prize Optimization

| Prize Category | Applicable | Justification |
|---------------|------------|---------------|
| **Grand Prize** | Yes | End-to-end protocol using CRE for real-world financial impact. Novel architecture combining multi-source data, AI adjudication, and instant payouts. |
| **Best DeFi Application** | Yes | Insurance pools as DeFi primitive. Two-sided market. Yield for underwriters. PolicyNFT composability. |
| **Best AI Integration** | Yes | AI adjudication inside TEE as core workflow component. Confidence-scored decision making. Structured output driving on-chain actions. |
| **Best Use of Real-World Data** | Yes | 15+ data source integrations. Multi-source consensus. Diverse real-world domains (weather, aviation, seismic, financial). |
| **Best Use of CRE** | Yes | 5 CRE workflows. Full capability utilization (Cron, HTTP Client, Consensus, EVM Read/Write, TEE). CRE is not an add-on -- it IS the protocol infrastructure. |
| **Best UX** | Possible | Gas-sponsored policy purchases via Thirdweb. Email/social login. No crypto knowledge required to get insured. Real-time monitoring dashboard. |
| **Most Innovative** | Possible | First fully autonomous parametric insurance protocol. AI-in-the-loop adjudication. PolicyNFT as insurance instrument. |

### Submission Checklist

- [ ] Smart contracts deployed to Avalanche Fuji (verified on explorer).
- [ ] CRE workflows deployed and running (monitoring visible in Pool Detail page).
- [ ] Frontend deployed (Vercel) with working Explore Pools, Pool Detail, My Policies, Create Pool.
- [ ] End-to-end demo: create pool -> purchase policy -> show monitoring -> trigger payout.
- [ ] 5-minute demo video recorded and uploaded.
- [ ] GitHub repo with README, architecture diagram, and deployment instructions.
- [ ] Submission form completed with all track selections.
