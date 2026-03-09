# CRE Integration — Surely

Parametric insurance on Chainlink CRE. Four workflows handle the full policy lifecycle — eligibility verification, real-time trigger monitoring, fiat-to-stablecoin payment processing, and AI-assisted settlement. Every workflow writes back on-chain through signed CRE reports. All contracts deployed on Base Sepolia.

**Repo:** https://github.com/joeloffbeat/surely

---

## Capability Matrix

| CRE Capability | Where It's Used |
|---|---|
| Cron Trigger | `trigger-monitoring` — polls 3 data sources every 10 min |
| HTTP Trigger | `eligibility-kyc`, `payment-fiat` |
| Log Trigger | `settlement` — fires on `MonitoringTick` event from `InsurancePool` |
| HTTP Client + `consensusIdenticalAggregation` | all 4 workflows (verification API, data sources, Stripe, AI adjudication) |
| EVM Write (`writeReport`) | all 4 workflows → `CRERouter`, `ComplianceConsumer`, `CZUSDConsumer` |
| ACE PolicyEngine | `CZUSDConsumer.onReport()` — every mint/burn runs through `PolicyEngine.run()` |

---

## Workflow 1 — Trigger Monitoring (Cron + HTTP Client + EVM Write)

Polls three independent data sources on a cron schedule, computes a median, evaluates against the pool's threshold, and writes a monitoring tick on-chain. If the value cleanly exceeds the threshold, it triggers settlement directly. Borderline cases are flagged for AI adjudication.

**File:** [`packages/cre/trigger-monitoring/main.ts`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts)

### Cron Trigger

- [`main.ts:2`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L2) — `import { CronCapability, ... } from "@chainlink/cre-sdk"`
- [`main.ts:40`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L40) — `new CronCapability()` instantiation
- [`main.ts:44`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L44) — `cron.trigger({ schedule: "*/10 * * * *" })` — every 10 minutes, DON nodes execute the handler

### 3x HTTP Client with Consensus

Three separate data sources are queried independently. All DON nodes must return identical results for each source before the median is computed.

- [`main.ts:59`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L59) — `new HTTPClient()` instantiation
- [`main.ts:64-68`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L64-L68) — Source 1: `httpClient.sendRequest(runtime, fetchSource, consensusIdenticalAggregation())` against `config.dataSource1Url`
- [`main.ts:70-74`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L70-L74) — Source 2: same pattern, `config.dataSource2Url`
- [`main.ts:76-80`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L76-L80) — Source 3: same pattern, `config.dataSource3Url`
- [`main.ts:93-97`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L93-L97) — Values extracted and sorted; median = `values[1]` (middle of 3)
- [`main.ts:116-130`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L116-L130) — Variance check: if sources disagree by >5%, the trigger is flagged as borderline instead of confirmed

### Threshold Evaluation

- [`main.ts:107-113`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L107-L113) — Comparison against `config.triggerThreshold` using `config.comparison` (0=LT, 1=GT)
- [`main.ts:136-156`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L136-L156) — Decision tree: clean trigger → `SETTLEMENT(1)`, borderline/disagree → `LOG(0)` with flag, safe → `LOG(0)`

### EVM Write

- [`main.ts:166-168`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L166-L168) — `runtime.report(prepareReportRequest(encodedPayload))` — CRE-signed report
- [`main.ts:171-177`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts#L171-L177) — `evmClient.writeReport()` to `CRERouter`, which routes report to the target `InsurancePool`

---

## Workflow 2 — Settlement (Log Trigger + HTTP Client + EVM Write)

Listens for `MonitoringTick` events emitted by `InsurancePool` when a borderline trigger is detected. Calls an AI adjudication endpoint to assess confidence, then writes the final settlement or rejection.

**File:** [`packages/cre/settlement/main.ts`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts)

### Log Trigger

- [`main.ts:69`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L69) — `new EVMClient(network.chainSelector.selector)`
- [`main.ts:73-75`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L73-L75) — `evmClient.logTrigger({ addresses: [hexToBase64(config.poolAddress)] })` — watches `InsurancePool` for `MonitoringTick` events
- [`main.ts:90-97`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L90-L97) — `decodeAbiParameters()` on log data — extracts `(int256 value, bool triggered, uint8 consecutiveCount, uint256 timestamp)`

### AI Adjudication via HTTP Client

- [`main.ts:104-113`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L104-L113) — Builds adjudication payload with threshold context, comparison result, and source values
- [`main.ts:119-124`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L119-L124) — `httpClient.sendRequest(runtime, callAdjudicate, consensusIdenticalAggregation())` — AI endpoint called with consensus; all DON nodes must get the same confidence score
- [`main.ts:134-146`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L134-L146) — Confidence thresholds: >0.8 + triggered → `SETTLEMENT`, >=0.5 → flagged LOG, <0.5 → false alarm

### EVM Write

- [`main.ts:155-157`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L155-L157) — `runtime.report(prepareReportRequest(encodedPayload))`
- [`main.ts:159-165`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts#L159-L165) — `evmClient.writeReport()` — writes settlement decision back to `CRERouter` → `InsurancePool`

---

## Workflow 3 — Eligibility KYC (HTTP Trigger + HTTP Client + EVM Write)

Accepts eligibility verification requests via HTTP trigger, calls an external verification API with consensus, then writes the compliance proof on-chain.

**File:** [`packages/cre/eligibility-kyc/main.ts`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts)

### HTTP Trigger

- [`main.ts:51`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L51) — `new HTTPCapability()`
- [`main.ts:54-59`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L54-L59) — `http.trigger({ authorizedKeys: [...] })` — ECDSA-authorized HTTP trigger, only signed requests accepted

### Verification API with Consensus

- [`main.ts:87`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L87) — `new HTTPClient()`
- [`main.ts:95-100`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L95-L100) — `httpClient.sendRequest(runtime, verifyUser, consensusIdenticalAggregation())` — POST to `config.verificationApiUrl/verify/all` with user identity data
- [`main.ts:47`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L47) — Response parsed as `{ eligible, kycPassed, proofHash }` — all DON nodes must agree on the result

### Report Encoding + EVM Write

- [`main.ts:108-117`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L108-L117) — `encodeAbiParameters(["uint8, address, uint8, bytes32, bool"], [0, userAddress, verificationType, proofHash, kycPassed])` — action type 0 = eligibility store
- [`main.ts:120-122`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L120-L122) — `runtime.report(prepareReportRequest(encodedPayload))`
- [`main.ts:125-131`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts#L125-L131) — `evmClient.writeReport()` to `ComplianceConsumer`

---

## Workflow 4 — Payment Fiat (HTTP Trigger + HTTP Client + EVM Write)

Receives fiat payment webhook data via HTTP trigger, verifies the payment against Stripe with DON consensus, then mints CZUSD on-chain.

**File:** [`packages/cre/payment-fiat/main.ts`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts)

### HTTP Trigger

- [`main.ts:50`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L50) — `new HTTPCapability()`
- [`main.ts:53-58`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L53-L58) — `http.trigger({ authorizedKeys: [...] })` — ECDSA-authorized

### Stripe Verification with Consensus

- [`main.ts:86`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L86) — `new HTTPClient()`
- [`main.ts:97-102`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L97-L102) — `httpClient.sendRequest(runtime, verifyStripePayment, consensusIdenticalAggregation())` — all DON nodes independently verify the same Stripe `paymentIntentId`; amount comes from Stripe's response, not the user payload
- [`main.ts:104-106`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L104-L106) — `if (!stripeResult.verified) throw` — hard failure if Stripe rejects

### CZUSD Mint via EVM Write

- [`main.ts:125`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L125) — Amount scaled: `BigInt(amount) * BigInt(10 ** 6)` — CZUSD uses 6 decimals
- [`main.ts:126-134`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L126-L134) — `encodeAbiParameters(["uint8, address, uint256, bytes32"], [2, recipient, amountCzusd, paymentProofHash])` — workflow type 2 = MINT_FIAT
- [`main.ts:137-139`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L137-L139) — `runtime.report(prepareReportRequest(encodedPayload))`
- [`main.ts:142-148`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts#L142-L148) — `evmClient.writeReport()` to `CZUSDConsumer` — triggers `onReport()` which calls `czusd.mint(recipient, amount)` after ACE policy check

---

## On-Chain CRE Report Receivers

### CRERouter — Report Routing to Insurance Pools

**File:** [`packages/contracts/src/CRERouter.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CRERouter.sol)

- [`CRERouter.sol:10`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CRERouter.sol#L10) — `contract CRERouter is Ownable`
- [`CRERouter.sol:29-36`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CRERouter.sol#L29-L36) — `function onReport(bytes calldata report)` — decodes `(address poolAddress, bytes poolReport)`, validates the pool is registered, forwards to `InsurancePool.onReport()`
- [`CRERouter.sol:32`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CRERouter.sol#L32) — `require(validPools[poolAddress])` — only factory-registered pools can receive reports

### ComplianceConsumer — KYC/Sanctions/Eligibility

**File:** [`packages/contracts/src/ComplianceConsumer.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ComplianceConsumer.sol)

- [`ComplianceConsumer.sol:18`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ComplianceConsumer.sol#L18) — `contract ComplianceConsumer is Ownable`
- [`ComplianceConsumer.sol:37-50`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ComplianceConsumer.sol#L37-L50) — `function onReport(bytes calldata report)` — decodes `(uint8 action, address target, uint8 verificationType, bytes32 proofHash)` and dispatches:
  - `action == 0` → `eligibilityRegistry.storeProof(target, verificationType, proofHash)`
  - `action == 1` → `sanctionsPolicy.addToDenyList(target)`
  - `action == 2` → `kycPolicy.setCredential(target)`

### CZUSDConsumer — Stablecoin Mint/Burn with ACE Enforcement

**File:** [`packages/contracts/src/CZUSDConsumer.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CZUSDConsumer.sol)

- [`CZUSDConsumer.sol:12`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CZUSDConsumer.sol#L12) — `contract CZUSDConsumer is Ownable`
- [`CZUSDConsumer.sol:20-23`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CZUSDConsumer.sol#L20-L23) — `modifier runPolicy() { policyEngine.run(msg.data); _; }` — every `onReport` call must pass the full ACE policy chain before executing
- [`CZUSDConsumer.sol:30-44`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/CZUSDConsumer.sol#L30-L44) — `function onReport(bytes calldata report) external runPolicy` — decodes `(uint8 workflowType, address recipient, uint256 amount, bytes32 proofHash)`:
  - `BURN(3)` → `czusd.burn(recipient, amount)`
  - `SETTLEMENT(4)` → `czusd.mint(recipient, amount)`
  - `MINT_CRYPTO(0) / MINT_CCIP(1) / MINT_FIAT(2)` → `czusd.mint(recipient, amount)`

### InsurancePool — Monitoring Tick + Settlement Execution

**File:** [`packages/contracts/src/InsurancePool.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/InsurancePool.sol)

- [`InsurancePool.sol:73`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/InsurancePool.sol#L73) — `event MonitoringTick(int256 value, bool triggered, uint8 consecutiveCount, uint256 timestamp)` — emitted on every monitoring report, consumed by settlement workflow via Log Trigger
- [`InsurancePool.sol:82-85`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/InsurancePool.sol#L82-L85) — `modifier runPolicy() { policyEngine.run(msg.data); _; }` — ACE enforcement on pool actions
- [`InsurancePool.sol:210-221`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/InsurancePool.sol#L210-L221) — `function onReport(bytes calldata report) external onlyRouter` — decodes `(uint8 action, int256 value, uint8 consecutiveCount, uint256 confidence)` and dispatches to `_logMonitoring()`, `_processSettlement()`, or `_expirePool()`
- [`InsurancePool.sol:239-261`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/InsurancePool.sol#L239-L261) — `_processSettlement(confidence)` — requires confidence > 80%, distributes CZUSD payouts to all policyholders, updates PolicyNFT status

---

## ACE PolicyEngine — 7 Composable Policies

Every CZUSD operation (mint, burn, settlement payout) passes through the ACE policy chain. The `UnifiedExtractor` decodes the CRE report into typed parameters, then each policy validates independently. Any single policy failure blocks the entire transaction.

**File:** [`packages/contracts/src/ace/PolicyEngine.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/PolicyEngine.sol)

- [`PolicyEngine.sol:28-39`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/PolicyEngine.sol#L28-L39) — `function run(bytes calldata callData) external override` — extracts selector, calls `IExtractor.extract(callData)`, iterates all registered `IPolicy` contracts, calls `validate(params)` on each

**File:** [`packages/contracts/src/ace/UnifiedExtractor.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/UnifiedExtractor.sol)

- [`UnifiedExtractor.sol:10-48`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/UnifiedExtractor.sol#L10-L48) — `function extract(bytes calldata callData)` — routes between CZUSDConsumer reports (workflowType 0-4) and InsurancePool reports (action 10+), extracts typed parameters for downstream policies

### Policies

| Policy | File | What it enforces |
|---|---|---|
| `SanctionsPolicy` | [`src/ace/SanctionsPolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/SanctionsPolicy.sol) | Denylisted addresses cannot receive CZUSD |
| `KYCPolicy` | [`src/ace/KYCPolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/KYCPolicy.sol) | Only KYC-credentialed addresses can interact |
| `CoolingOffPolicy` | [`src/ace/CoolingOffPolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/CoolingOffPolicy.sol) | Enforces minimum time between operations |
| `EligibilityPolicy` | [`src/ace/EligibilityPolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/EligibilityPolicy.sol) | Requires valid eligibility proof on-chain |
| `SolvencyPolicy` | [`src/ace/SolvencyPolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/SolvencyPolicy.sol) | Pool must have sufficient reserves for payout |
| `PremiumVolumePolicy` | [`src/ace/PremiumVolumePolicy.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/PremiumVolumePolicy.sol) | Caps max volume per operation |
| `UnifiedExtractor` | [`src/ace/UnifiedExtractor.sol`](https://github.com/joeloffbeat/surely/blob/main/packages/contracts/src/ace/UnifiedExtractor.sol) | Decodes CRE reports into typed params for policy validation |

---

## Workflow Configuration

**File:** [`packages/cre/project.yaml`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/project.yaml)

| Workflow | Trigger | Capabilities | Target Contract |
|---|---|---|---|
| [`trigger-monitoring`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/trigger-monitoring/main.ts) | Cron (10 min) | 3x HTTP Client + consensus, EVM Write | `CRERouter` → `InsurancePool` |
| [`settlement`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/settlement/main.ts) | Log (`MonitoringTick`) | HTTP Client (AI adjudication) + consensus, EVM Write | `CRERouter` → `InsurancePool` |
| [`eligibility-kyc`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/eligibility-kyc/main.ts) | HTTP (ECDSA) | HTTP Client (verification API) + consensus, EVM Write | `ComplianceConsumer` |
| [`payment-fiat`](https://github.com/joeloffbeat/surely/blob/main/packages/cre/payment-fiat/main.ts) | HTTP (ECDSA) | HTTP Client (Stripe) + consensus, EVM Write | `CZUSDConsumer` |

---

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|---|---|
| SurelyFactory | `0x327f771EE67BeD16C7d8C3646c996e09d0e7566e` |
| PolicyNFT | `0xC6D66927f90D072676792EEa0CBbEcA717419f1A` |
| CZUSD | `0xA8D24aDd4E9CE85e6875251a4a0a796BAa2acfCF` |
| CZUSDConsumer | `0xE6D1361B28713eE61d09D0a574F3Dcc7A49aA6F3` |
| CRERouter | `0xB875b7132aE48fe7b3029C2b74D3E42A5A6A68b4` |
| EligibilityRegistry | `0x2AC06eA51ae0C56ff2d74441206E081EECAE83fF` |
| ComplianceConsumer | `0xF9190C124b9f34d97c5153517FF5c6BD654e0f01` |
| PolicyEngine (ACE) | `0xcF6031722B1F571E3553F9475AFB370CA6c4af7c` |

---

*Chainlink Convergence — CRE & AI, Risk & Compliance tracks.*
