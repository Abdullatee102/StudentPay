// ─────────────────────────────────────────────────────────────────────────────
// WalletConnect — renders the Reown AppKit connect button
// ─────────────────────────────────────────────────────────────────────────────
// The <w3m-button> web component is globally registered by createAppKit().
// No additional imports needed.
// ─────────────────────────────────────────────────────────────────────────────

import { useWallet } from '@/hooks/useWallet'
import styles from './WalletConnect.module.css'

// Tell TypeScript about the Reown web components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'w3m-button':        React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'w3m-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export default function WalletConnect() {
  const { balance, isConnected } = useWallet()

  return (
    <div className={styles.wrapper}>
      {isConnected && balance && (
        <span className={styles.balance}>
          {parseFloat(balance.formatted).toFixed(4)}{' '}
          <span className={styles.symbol}>{balance.symbol}</span>
        </span>
      )}
      {/* Reown AppKit button — handles connect / disconnect / account display */}
      <w3m-button />
    </div>
  )
}

