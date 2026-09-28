// ─────────────────────────────────────────────────────────────────────────────
// NetworkGuard — prompts the user to switch to Bohr Testnet if on wrong chain
// ─────────────────────────────────────────────────────────────────────────────
import type { ReactNode } from 'react'
import { useWallet } from '@/hooks/useWallet'
import styles from './NetworkGuard.module.css'

interface Props {
  children: ReactNode
}

export default function NetworkGuard({ children }: Props) {
  const { isConnected, isOnBohr, switchToBohr } = useWallet()

  // If wallet isn't connected, let the page handle it
  if (!isConnected) return <>{children}</>

  if (!isOnBohr) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h2 className={styles.title}>Wrong Network</h2>
          <p className={styles.desc}>
            StudentPay runs on <strong>Bohr Testnet</strong> (Chain ID: 968).
            <br />
            Please switch your wallet to continue.
          </p>
          <button className="btn btn-primary" onClick={switchToBohr}>
            Switch to Bohr Testnet
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

