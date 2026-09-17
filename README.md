# StudentPay Escrow

> Peer-to-peer crypto escrow for students — trustless, transparent, on-chain.

---

## The Problem

Students frequently transact with each other for services: tutoring, design work, coding help, essay proofreading, club merchandise, and more. These informal agreements carry real risk:

- The buyer pays upfront and the seller disappears.
- The seller delivers the work and the buyer refuses to pay.
- No neutral third party exists to resolve disputes.

Traditional payment platforms require personal banking, charge fees, and centralise control. Neither party has cryptographic guarantees.

## Why Blockchain

A smart contract is a neutral, uncensorable third party. It holds funds in escrow and only releases them when the agreed conditions are met — provably and automatically, without requiring either party to trust the other or a platform operator.

StudentPay uses **no backend database**, **no centralised authentication**, and **no server that could go down or be compromised**. The smart contract _is_ the application logic.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER (Frontend)                │
│                                                     │
│  React + Vite + TypeScript                          │
│  wagmi 2.x  ·  viem  ·  Reown AppKit               │
│  TanStack Query                                     │
│                                                     │
│  Wallet ──► WalletConnect / MetaMask                │
└────────────────────┬────────────────────────────────┘
                     │  JSON-RPC calls (read/write)
                     ▼
┌─────────────────────────────────────────────────────┐
│              Bohr Testnet (Chain ID: 968)            │
│                                                     │
│  StudentPayEscrow.sol                               │
│  · createDeal                                       │
│  · fundDeal (payable)                               │
│  · markWorkCompleted                                │
│  · releaseFunds                                     │
│  · claimRefund                                      │
│  · cancelDeal                                       │
└─────────────────────────────────────────────────────┘
```

### What is NOT included (by design)

| NOT included         | Why                                                    |
| -------------------- | ------------------------------------------------------ |
| Express / Node API   | No backend needed — contract is the logic layer        |
| PostgreSQL / MongoDB | No centralised DB — chain state is the source of truth |
| Firebase / Supabase  | No centralised auth — wallet signature proves identity |
| REST endpoints       | No API — frontend reads directly from chain via RPC    |

---

## Network — Bohr Testnet

| Parameter    | Value                  |
| ------------ | ---------------------- |
| Network      | Bohr Testnet           |
| Chain ID     | 968                    |
| RPC URL      | https://rpc.bohr.life  |
| Native Token | BOT                    |
| Explorer     | https://scan.bohr.life |

Network configuration lives in a **single file**: [`frontend/src/config/chains.ts`](frontend/src/config/chains.ts). Switching to mainnet or another EVM chain requires editing only that file.

---

## Project Structure

```
StudentPay/
├── src/                          # Solidity contracts
│   └── StudentPayEscrow.sol
├── test/                         # Foundry tests
│   └── StudentPayEscrow.t.sol
├── script/                       # Deployment scripts
│   └── DeployStudentPayEscrow.s.sol
├── lib/                          # Foundry dependencies (forge-std)
├── foundry.toml                  # Foundry config
├── .env.example                  # Deployment env template
│
└── frontend/                     # React frontend
    ├── src/
    │   ├── config/
    │   │   ├── chains.ts         # ← SINGLE source for network config
    │   │   ├── wagmi.ts          # wagmi + Reown adapter setup
    │   │   └── appkit.ts         # Reown AppKit initialisation
    │   ├── contracts/
    │   │   ├── StudentPayEscrow.abi.ts   # Contract ABI (typed)
    │   │   └── types.ts                  # TS types mirroring Solidity
    │   ├── hooks/
    │   │   ├── useEscrow.ts      # All contract read/write hooks
    │   │   └── useWallet.ts      # Wallet state / chain switching
    │   ├── components/
    │   │   ├── Layout.tsx        # App shell, nav, footer
    │   │   ├── WalletConnect.tsx # Reown AppKit w3m-button
    │   │   ├── NetworkGuard.tsx  # Prompts wrong-chain users to switch
    │   │   ├── DealStatusBadge.tsx
    │   │   └── TxStatus.tsx      # Spinner, explorer link, error display
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── CreateDeal.tsx
    │   │   ├── MyDeals.tsx
    │   │   └── DealDetails.tsx
    │   ├── utils/
    │   │   └── format.ts
    │   └── styles/
    │       ├── global.css
    │       └── components.css
    └── .env.example              # Frontend env template
```

---

## Frontend Stack

| Package                     | Purpose                         |
| --------------------------- | ------------------------------- |
| React 18 + Vite + TS        | UI framework and build tooling  |
| wagmi 2.x                   | React hooks for Ethereum        |
| viem                        | Low-level Ethereum client       |
| @reown/appkit               | Wallet modal (WalletConnect v3) |
| @reown/appkit-adapter-wagmi | Connects AppKit to wagmi config |
| @tanstack/react-query       | Async state management          |
| react-router-dom 6          | Client-side routing             |

---

## Smart Contract Stack

| Tool            | Purpose                                     |
| --------------- | ------------------------------------------- |
| Foundry/Forge   | Compile, test, deploy Solidity contracts    |
| Solidity 0.8.24 | Contract language                           |
| forge-std       | Testing utilities (Test, console, makeAddr) |

---

## Deal Lifecycle

```
createDeal()
     │
     ▼
PENDING_FUNDING ──► cancelDeal() ──► CANCELLED
     │
     ▼ fundDeal()
FUNDED ──────────────────────────────────────────────┐
     │                                               │
     ▼ markWorkCompleted()                  deadline passes
COMPLETED                                            │
     │                                               ▼
     ▼ releaseFunds()                        claimRefund()
RELEASED                                        REFUNDED
```

---

## Environment Configuration

### Frontend (`frontend/.env.local`)

```env
VITE_REOWN_PROJECT_ID=      # From https://cloud.reown.com
VITE_BOHR_RPC_URL=https://rpc.bohr.life
VITE_BOHR_CHAIN_ID=968
VITE_ESCROW_CONTRACT_ADDRESS=0xC434E1E19c54d3Bb451dAf8D2eF8C64aa40B086A
```

Deployed contract: [StudentPayEscrow on Bohr Explorer](https://scan.bohr.life/address/0xC434E1E19c54d3Bb451dAf8D2eF8C64aa40B086A)

### Deployment (`.env` — root level)

```env
PRIVATE_KEY=               # Deployer wallet private key
BOHR_RPC_URL=https://rpc.bohr.life
```

> ⚠️ **Security**: `PRIVATE_KEY` must NEVER be in any `VITE_*` variable.
> `VITE_*` variables are embedded in the browser bundle at build time.

---

## Development Commands

### Smart Contracts

```bash
# Install forge-std (already done if you cloned with submodules)
forge install foundry-rs/forge-std --no-commit

# Compile contracts
forge build

# Run tests
forge test -vv

# Run tests with gas report
forge test --gas-report

# Deploy to Bohr Testnet (dry run — no broadcast)
forge script script/DeployStudentPayEscrow.s.sol --rpc-url bohr_testnet

# Deploy for real (requires PRIVATE_KEY in .env)
forge script script/DeployStudentPayEscrow.s.sol \
  --rpc-url bohr_testnet \
  --broadcast
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
# (then fill in VITE_REOWN_PROJECT_ID and VITE_ESCROW_CONTRACT_ADDRESS)

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Security Notes

1. **No private keys in code**: The deployer key is read from environment variables only at deploy time. It is never in the frontend codebase.

2. **No VITE\_ prefix for secrets**: `VITE_*` vars are bundled into the browser JavaScript. They are fine for public config (RPC URL, chain ID, contract address). They must never hold private keys or API secrets.

3. **`.env` and `.env.local` are gitignored**: The `.gitignore` covers all secret env files. Only `.env.example` templates (with no values) are committed.

4. **Reentrancy protection**: The contract uses a manual reentrancy guard on all payable and fund-transferring functions.

5. **No admin key**: There is no `owner`, no `onlyOwner`, no upgrade mechanism. Funds can only move according to the deal lifecycle rules.

6. **Custom errors**: Gas-efficient `revert` errors with specific selectors make on-chain failures debuggable.

---

## Getting a Reown Project ID

1. Go to [https://cloud.reown.com](https://cloud.reown.com)
2. Sign in and create a new project
3. Copy the **Project ID**
4. Add it to `frontend/.env.local` as `VITE_REOWN_PROJECT_ID=<your-id>`

MetaMask will work through the standard wallet injected provider flow. No special configuration required.

---

## Roadmap (Future Prompts)

- [ ] Dispute / arbitration system
- [ ] Multi-token support (ERC-20 stablecoins)
- [ ] Student reputation / review system
- [ ] IPFS attachment storage (deliverables)
- [ ] Partial release / milestone payments
- [ ] Mainnet deployment

---

_Built with Foundry + React + Reown AppKit · Bohr Testnet_
