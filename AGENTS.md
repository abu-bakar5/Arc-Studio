# Arc Agent — ERC-8004 + x402

> Built with Arc Studio - money-powered apps in minutes

## What This App Does

An onchain agent identity app that:
1. Registers an AI agent's identity on Arc Testnet using ERC-8004 (IdentityRegistry).
2. Exposes a paid HTTP API endpoint protected by x402 Circle Gateway Nanopayments ($0.01 USDC per call).

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Arc Light design
- Web3: wagmi v2, viem v2, ConnectKit
- Payment: @circle-fin/x402-batching (Circle Gateway Nanopayments)
- Server: Express (Node/Bun), runs on port 3001
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC (6 decimals) — also the native gas token on Arc

## ERC-8004 Registry Addresses (Arc Testnet)

- IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- ValidationRegistry: `0x8004Cb1BF31DAf7788923b405b754f57acEB4272`

## Key Files

- `src/App.tsx` — Main app: ERC-8004 registration flow + x402 UI
- `src/components/AgentCard.tsx` — Displays registered agent identity
- `src/components/ServicePanel.tsx` — 402 probe + paid call demo
- `src/components/RegistrationFile.tsx` — JSON registration file template
- `server/index.ts` — Express x402 payment server

## Environment Variables

```bash
VITE_AGENT_SELLER_ADDRESS=0x<your-wallet-address>   # receives x402 payments
```

## Running

```bash
# Frontend only
bun run dev

# Payment server only (port 3001)
bun run server

# Both together
bun run start
```

## Notes

- Gas on Arc Testnet is USDC — get test USDC from "Get test USDC" in the Arc Studio sidebar.
- Registration costs ~0.006 USDC in gas per call.
- The x402 server returns 402 for unpaid calls; a Circle agent wallet pays automatically.
- Both ERC-8004 and the registry addresses are drafts — verify against https://docs.arc.io before mainnet use.
