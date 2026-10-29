// ─────────────────────────────────────────────────────────────────────────────
// Blockchain / Network Configuration — BotChain Mainnet
// ─────────────────────────────────────────────────────────────────────────────
// All network settings live here.
// ─────────────────────────────────────────────────────────────────────────────
import { defineChain } from 'viem'

// ── BotChain Mainnet ──────────────────────────────────────────────────────────
export const botchain = defineChain({
  id: Number(import.meta.env.VITE_BOTCHAIN_CHAIN_ID ?? 677),
  name: 'BotChain',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_BOTCHAIN_RPC_URL ?? 'https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BotChain Explorer',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
})

// Legacy export for backwards compatibility
export const bohrTestnet = botchain

// ── Supported chains ──────────────────────────────────────────────────────────
export const SUPPORTED_CHAINS: [typeof botchain, ...(typeof botchain)[]] = [botchain]

// ── Contract addresses ────────────────────────────────────────────────────────
// Deployed & Verified on BotChain Mainnet
export const CONTRACT_ADDRESSES = {
  escrow: (import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS ??
    '0x59540a9B86c2bFB4F2591c840A6377484200d680') as `0x${string}`,
} as const

// ── Network metadata ──────────────────────────────────────────────────────────
export const NETWORK_CONFIG = {
  defaultChainId: botchain.id,
  explorerUrl: 'https://scan.botchain.ai',
  explorerTxPath: '/tx/',
  explorerAddressPath: '/address/',
} as const
