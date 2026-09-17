// ─────────────────────────────────────────────────────────────────────────────
// Reown AppKit Initialisation
// ─────────────────────────────────────────────────────────────────────────────
// createAppKit MUST be called once, at the module level, before any React code.
// ─────────────────────────────────────────────────────────────────────────────
import { createAppKit } from '@reown/appkit'
import { SUPPORTED_CHAINS } from './chains'
import { REOWN_PROJECT_ID, wagmiAdapter } from './wagmi'

const APP_URL =
  import.meta.env.VITE_APP_URL ?? 'https://student-pay.vercel.app'

createAppKit({
  adapters: [wagmiAdapter],
  networks: SUPPORTED_CHAINS,
  defaultNetwork: SUPPORTED_CHAINS[0],
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: 'StudentPay Escrow',
    description: 'Peer-to-peer crypto escrow for students — powered by Bohr Testnet',
    url: APP_URL,
    icons: ['/logo.svg'],
  },
  features: {
    analytics: false, // set to true if you opt-in to Reown analytics
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',      // indigo accent matching app palette
    '--w3m-border-radius-master': '8px',
  },
})

// Re-export for convenience
export { REOWN_PROJECT_ID }

