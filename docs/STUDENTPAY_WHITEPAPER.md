# StudentPay Escrow — White Paper & Pitch Deck

**Version**: 2.0  
**Network**: Bohr Testnet (Chain ID: 968)  
**Contract Address**: `0x7591428059DcAD6De8D51177080959F8B347603D`  
**Live DApp**: [https://student-pay-rcpc.vercel.app](https://student-pay-rcpc.vercel.app)  

---

## Executive Summary

StudentPay Escrow is a decentralized, peer-to-peer crypto escrow application built specifically for student services and freelance work. By removing centralized intermediaries, server databases, and custodial risk, StudentPay allows students to create binding, trustless agreements protected by smart contracts on the Bohr Testnet. 

The platform features a proprietary **Dual-Level Protected Access** architecture: buyers can view a watermarked **Protected Preview** of the deliverable before payment release, while the usable **Original Deliverable** remains locked on-chain until payment is released or auto-released following a 48-hour dispute window.

---

## 1. The Problem

Students frequently transact with peers for academic tutoring, design, software development, video editing, essay feedback, and event organization. Traditional payment mechanisms present severe risks:

- **Upfront Payment Risk**: Buyers pay first and sellers ghost or deliver substandard work.
- **Post-Delivery Non-Payment**: Sellers deliver completed assets, but buyers refuse to transfer funds.
- **Work-Stealing Vulnerability**: In digital transactions, buyers often demand previews, steal raw source files or designs, and decline payment.
- **Centralized Intermediary Overhead**: Traditional escrow services charge heavy commissions (10%-20%), require identity verification (KYC), and rely on centralized databases vulnerable to censorship or server downtime.

---

## 2. The Opportunity

Higher education campuses host vibrant micro-economies. A decentralized, zero-commission escrow platform enables students to monetize skills safely without trusting unknown peers.

By leveraging smart contracts on an EVM-compatible blockchain (Bohr Testnet), StudentPay transforms peer agreements into self-executing, mathematically guaranteed escrows requiring zero custodial trust.

---

## 3. The StudentPay Solution

StudentPay eliminates counterparty risk using non-custodial smart contracts, cryptographic commitments, and dual-level deliverable access control:

1. **Zero Centralized Backend**: No Express server, PostgreSQL, or Supabase. The smart contract on Bohr Testnet handles all business logic and state.
2. **Blinded Proof Commitments**: Sellers submit a cryptographic hash (`keccak256`) of their deliverable before the deadline, preventing work-stealing and late submissions.
3. **Protected Preview Inspection**: Buyers inspect watermarked previews (`STUDENTPAY • PREVIEW ONLY`) directly inside the dApp to verify work quality.
4. **Original Asset Lock**: Raw downloadable assets remain locked until payment is released on-chain.
5. **Fair Settlement & Anti-Ghosting**: A 48-hour post-submission review window allows buyers to accept or open disputes. If a buyer ghosts, sellers can claim an automatic payout.

---

## 4. How StudentPay Works (5-Step Core Workflow)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. CREATE DEAL  │ ────► │ 2. SUBMIT PROOF │ ────► │ 3. BUYER INSPECTS│
│ Buyer locks BOT │       │ Seller submits  │       │ Watermarked     │
│ in escrow       │       │ commitment hash │       │ Protected Preview│
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
                          ┌──────────────────────────────────┴──────────────────────────────────┐
                          ▼                                                                     ▼
               ┌─────────────────────┐                                               ┌─────────────────────┐
               │ 4a. ACCEPT & RELEASE│                                               │ 4b. OPEN DISPUTE    │
               │ Payment transfers   │                                               │ Auto-release frozen │
               │ to seller           │                                               │ Buyer claims refund │
               └──────────┬──────────┘                                               └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │ 5. UNLOCK ASSET     │
               │ Original deliverable│
               │ unlocked for buyer  │
               └─────────────────────┘
```

---

## 5. Core Implemented Features

### Feature 1: Blinded Proof Commitment (`keccak256`)
- **What it does**: Computes a cryptographic hash of the actual submitted deliverable (file, URL, or code) before the agreed deadline.
- **Why it matters**: Guarantees the seller finished the work on time without exposing raw files to theft prior to payment.

### Feature 2: Dual-Level Deliverable Access (Protected Preview vs. Original)
- **What it does**: Renders watermarked previews for images, videos, audio, documents, websites, and code while disabling right-click, text selection, and downloads.
- **Why it matters**: Protects sellers against work-stealing while giving buyers confidence to inspect quality before releasing funds.

### Feature 3: 48-Hour Review & Dispute Window
- **What it does**: Starts a 48-hour countdown after seller submission. The buyer can accept & release payment immediately or open a dispute if requirements are unmet.
- **Why it matters**: Provides a structured review window for buyers while enforcing refund protection.

### Feature 4: Anti-Ghosting Auto-Release Payout
- **What it does**: Allows the seller to claim a 100% automatic payout if the 48-hour grace window expires without buyer dispute.
- **Why it matters**: Prevents malicious or unresponsive buyers from withholding seller funds indefinitely.

### Feature 5: Deadline Refund Guarantee
- **What it does**: Enables the buyer to claim a 100% instant refund if the seller misses the submission deadline.
- **Why it matters**: Ensures buyers are not trapped when sellers fail to perform.

---

## 6. User Journey

### Buyer (Client) Journey
1. Connects wallet (MetaMask / WalletConnect) via Reown AppKit.
2. Navigates to **Create Deal**, enters seller wallet address, payment amount (BOT), deadline, and work requirements.
3. Confirms `createDeal` and `fundDeal` on-chain.
4. Once seller submits work, opens **Deal Details** and clicks `[ 👁 VIEW PROTECTED PREVIEW ]`.
5. Inspects watermarked asset.
6. Clicks `[ Accept & Release Funds ]` ➔ Confirms release modal ➔ Downloads unlocked original asset (`[ 🔓 Download Original ]`).

### Seller (Provider) Journey
1. Connects wallet and views assigned deals in **My Deals**.
2. Completes agreed work before the deadline.
3. Selects deliverable format (File, Verifiable URL, or Code), uploads/enters artifact, and clicks `[ Submit Deliverable & Commit On-Chain ]`.
4. Smart contract records submission timestamp and `keccak256` commitment hash.
5. Monitors 48-hour review window. Receives funds instantly upon buyer acceptance or claims `[ Claim Auto-Release ]` if buyer is unresponsive.

---

## 7. Technical Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER (Frontend)                     │
│                                                                   │
│   React 18  ·  Vite  ·  TypeScript  ·  react-router-dom 6         │
│   wagmi 2.x  ·  viem  ·  Reown AppKit  ·  TanStack Query          │
│   deliverableStore (IndexedDB / LocalStorage)                    │
│   ProtectedPreviewModal (Dynamic SVG/Canvas Watermarking)         │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ JSON-RPC (eth_call, eth_sendRawTransaction)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER (Bohr Testnet)                 │
│                                                                   │
│   Chain ID: 968  ·  RPC: https://rpc.bohr.life  ·  Token: BOT     │
│                                                                   │
│   StudentPayEscrow.sol (0x7591428059DcAD6De8D51177080959F8B347603D)│
│   ├── createDeal(seller, amount, deadline, description)          │
│   ├── fundDeal(dealId) [payable]                                  │
│   ├── submitProof(dealId, commitmentHash)                         │
│   ├── releaseFunds(dealId)                                        │
│   ├── openDispute(dealId)                                         │
│   ├── claimAutoRelease(dealId)                                    │
│   └── claimRefund(dealId)                                         │
└───────────────────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack

- **Frontend Framework**: React 18, TypeScript 5.6, Vite 6.
- **Web3 Interface**: wagmi 2.13, viem 2.21, Reown AppKit 1.6 (WalletConnect v3).
- **State Management**: TanStack React Query 5.
- **Smart Contract**: Solidity 0.8.24, Foundry / Forge testing & deployment framework.
- **Local Persistence**: Client-side IndexedDB / LocalStorage (`deliverableStore.ts`).
- **Network**: Bohr Testnet (Chain ID 968, BOT native token, Explorer: `https://scan.bohr.life`).

---

## 9. Blockchain & Web3 Layer

### Why Blockchain?
Blockchain guarantees that escrow funds cannot be seized, altered, or misappropriated by any centralized entity. Settlement rules are immutable once deployed.

### On-Chain vs. Off-Chain Data
- **On-Chain**: Deal ID, buyer address, seller address, locked BOT amount, deadline timestamp, status enum, commitment hash (`bytes32`), submission timestamp, grace window expiration timestamp.
- **Off-Chain (Client-Side Storage)**: Raw file bytes / Data URLs, supplementary notes, and watermarked preview payloads stored locally via `deliverableStore.ts`.

---

## 10. Security & Trust Mechanisms

1. **Non-Custodial Architecture**: Smart contract holds funds; no admin key, owner backdoor, or upgrade proxy exists.
2. **Reentrancy Protection**: All fund transfers are guarded by custom `nonReentrant` state locks.
3. **Anti-Work-Stealing**: Deliverables remain protected by dynamic client-side watermarks (`STUDENTPAY • PREVIEW ONLY • BUYER: 0x...`) until payment is released.
4. **Input & Strict Deadline Validation**: Submissions after deadline are rejected on-chain; refunds activate automatically.

---

## 11. Value Proposition

| Stakeholder | Value Provided |
| ----------- | -------------- |
| **Student Buyers** | Inspect work before payment; full refund guarantee if deadlines or requirements are missed. |
| **Student Sellers** | Guaranteed payment for valid work; anti-ghosting auto-release after 48 hours; zero platform fees. |
| **Campuses & Peer Economy** | Frictionless, trustless micro-service exchange without bank accounts or centralized gateways. |

---

## 12. Differentiating Advantages

1. **Protected Preview Inspection**: Unlike primitive escrows that force blind payments, StudentPay lets buyers visually/functionally inspect work via watermarked previews.
2. **Zero Server Overhead**: Operates 100% client-to-chain. No database server costs, API outages, or centralized authentication vulnerabilities.
3. **Anti-Ghosting Safeguard**: Protects sellers against unresponsive buyers via automated 48-hour payout claims.

---

## 13. Current Product Status

- **Smart Contract**: Fully deployed V2 contract on Bohr Testnet at `0x7591428059DcAD6De8D51177080959F8B347603D`.
- **Test Suite**: 21 passing unit & integration tests (`forge test`).
- **Frontend DApp**: Fully built, production-compiled, and deployed on Vercel at `https://student-pay-rcpc.vercel.app`.
- **Protected Preview**: Operational for files, images, videos, audio, URLs, and source code.

---

## 14. Product Roadmap

- **Phase 1 (Completed)**: Core V2 escrow, blinded proof commitments, 48h review window, auto-release, and protected preview system on Bohr Testnet.
- **Phase 2 (Planned)**: Decentralized IPFS deliverable storage integration with client-side encryption.
- **Phase 3 (Planned)**: Multi-token ERC-20 stablecoin support (USDT/USDC).
- **Phase 4 (Planned)**: On-chain student reputation & verifiable completion badges.
- **Phase 5 (Planned)**: Mainnet multi-chain deployment & campus ambassador program.

---

## 15. Conclusion & Call to Action

StudentPay proves that peer-to-peer student service exchanges can be secure, trustless, and zero-fee. By combining smart contract escrows with protected preview verification, StudentPay solves the fundamental dilemma of digital service delivery: **preventing work-stealing while ensuring buyer satisfaction.**

- **Explore DApp**: [https://student-pay-rcpc.vercel.app](https://student-pay-rcpc.vercel.app)
- **View Contract on Bohr Explorer**: [0x7591428059...603D](https://scan.bohr.life/address/0x7591428059DcAD6De8D51177080959F8B347603D)
