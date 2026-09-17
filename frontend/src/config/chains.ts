// ─────────────────────────────────────────────────────────────────────────────
// Blockchain / Network Configuration
// ─────────────────────────────────────────────────────────────────────────────
// All network settings live here. To switch networks, update this file only.
// ─────────────────────────────────────────────────────────────────────────────

import { defineChain, type Address } from 'viem'

// ── Bohr Testnet ──────────────────────────────────────────────────────────────
export const bohrTestnet = defineChain({
  id: Number(import.meta.env.VITE_BOHR_CHAIN_ID ?? 968),
  name: 'Bohr Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bohr Testnet Token',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_BOHR_RPC_URL ?? 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Bohr Explorer',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
})

// ── Supported chains (add mainnet here when going to production) ───────────────
export const SUPPORTED_CHAINS = [bohrTestnet] as [typeof bohrTestnet]

// ── Contract addresses ────────────────────────────────────────────────────────
// Populated after deployment. Use VITE_ESCROW_CONTRACT_ADDRESS in .env.local
export const CONTRACT_ADDRESSES = {
  escrow: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS as Address | undefined,
} as const

// ── Network metadata ──────────────────────────────────────────────────────────
export const NETWORK_CONFIG = {
  defaultChainId: bohrTestnet.id,
  explorerUrl: 'https://scan.bohr.life',
  explorerTxPath: '/tx/',
  explorerAddressPath: '/address/',
} as const

