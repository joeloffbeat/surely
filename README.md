# Surely

Parametric insurance protocol on Chainlink CRE. Insurance pools with custom trigger conditions, multi-source data verification, AI adjudication, and instant on-chain payouts.

## Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Thirdweb Connect
- **Contracts:** Foundry, Solidity, OpenZeppelin v5
- **Automation:** Chainlink CRE (Cron, HTTP, EVM Read/Write, TEE)
- **Compliance:** Chainlink ACE (Autonomous Compliance Engine)
- **Payments:** Stripe (fiat) + CZUSD (crypto)

## Packages
- `packages/webapp/` — Next.js web application
- `packages/contracts/` — Foundry smart contracts
- `packages/cre/` — Chainlink CRE workflows
- `packages/mock-server/` — Mock HTTP server for testing
- `docs/` — Product documentation

## Development
```bash
# Webapp
cd packages/webapp && npm install && npm run dev

# Contracts
cd packages/contracts && forge test

# Mock server
cd packages/mock-server && npm install && npx ts-node index.ts
```

## Architecture
- Factory pattern for creating insurance pools
- NFT-based policy ownership
- ACE-integrated compliance engine (KYC, sanctions, solvency, cooling-off)
- 4 CRE workflows: eligibility-kyc, trigger-monitoring, payment-fiat, settlement
- Claude Service for AI-powered risk assessment

## License
MIT
