// ─────────────────────────────────────────────────────────────────────────────
// Wagmi Configuration
// ─────────────────────────────────────────────────────────────────────────────
import { createConfig, http, type Config } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bohrTestnet, SUPPORTED_CHAINS } from './chains'

// ── Reown AppKit project ID ───────────────────────────────────────────────────
// Get your project ID at: https://cloud.reown.com
export const REOWN_PROJECT_ID: string =
  import.meta.env.VITE_REOWN_PROJECT_ID ?? ''

if (!REOWN_PROJECT_ID) {
  console.warn(
    '[BotStudentPay] VITE_REOWN_PROJECT_ID is not set. ' +
      'Wallet connection UI may not load correctly. ' +
      'Create a project at https://cloud.reown.com and add it to .env.local'
  )
}

// ── Wagmi Adapter (used by Reown AppKit) ─────────────────────────────────────
export const wagmiAdapter = new WagmiAdapter({
  networks: SUPPORTED_CHAINS,
  projectId: REOWN_PROJECT_ID,
  ssr: false,
})

// ── Wagmi config ──────────────────────────────────────────────────────────────
export const wagmiConfig = wagmiAdapter.wagmiConfig as unknown as Config

// ── Standalone wagmi config (for use outside AppKit context if needed) ─────────
export const standaloneWagmiConfig = createConfig({
  chains: [bohrTestnet],
  transports: {
    [bohrTestnet.id]: http(
      import.meta.env.VITE_BOHR_RPC_URL ?? 'https://rpc.bohr.life'
    ),
  },
})

