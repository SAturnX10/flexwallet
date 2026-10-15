# Flex Wallet

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Flex Wallet is a calm, premium crypto wallet with savings goals. It manages 12 Arc assets (USDC, EURC, USYC, cirBTC, and 8 local-currency stablecoins), lets users claim @usernames, send USDC on-chain, create savings goals, and configure auto-conversion rules. Preview mode works without a wallet; real flows require MetaMask or an injected wallet on Arc Testnet.

## Architecture

- **Frontend**: React + TypeScript + wagmi v2 + Vite (port 5173)
- **Backend**: Bun + Elysia API (port 3001, proxied via `/api`)  
- **Database**: SQLite at `data/flexwallet.db` via `bun:sqlite`
- **Server entry**: `server/index.ts` (run with `bun run server`)

## Key Files

- `src/App.tsx` — top-level composition: routing, demo mode, modal management
- `src/components/pages/` — Overview, Savings, Activity, Settings
- `src/components/` — SendModal, AddFundsModal, UsernameModal, Sidebar, Header, Onboarding
- `src/components/ui/` — Button, Modal, Skeleton, Sparkline, ProgressBar, CountUp, AssetIcon
- `src/hooks/` — useWalletSettings, usePrices, useMotion
- `src/lib/api.ts` — typed API client (all routes)
- `src/lib/utils.ts` — formatters, validators
- `src/types.ts` — shared TypeScript types
- `server/db.ts` — SQLite schema + types
- `server/assets.ts` — asset registry (12 assets with capability flags)

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
