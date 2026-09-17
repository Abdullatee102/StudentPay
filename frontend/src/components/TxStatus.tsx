// ─────────────────────────────────────────────────────────────────────────────
// TxStatus — shows transaction hash and confirmation state
// ─────────────────────────────────────────────────────────────────────────────
import { NETWORK_CONFIG } from '@/config/chains'
import styles from './TxStatus.module.css'

interface Props {
  hash?:   `0x${string}`
  isPending:  boolean
  isConfirmed?: boolean
  error?:  Error | null
  label?:  string
}

export default function TxStatus({ hash, isPending, isConfirmed, error, label }: Props) {
  if (!hash && !isPending && !error) return null

  const explorerUrl = hash
    ? `${NETWORK_CONFIG.explorerUrl}${NETWORK_CONFIG.explorerTxPath}${hash}`
    : null

  return (
    <div className={styles.wrapper}>
      {isPending && (
        <p className={styles.pending}>
          <span className={styles.spinner} />
          {label ?? 'Transaction submitted…'} waiting for confirmation
        </p>
      )}

      {isConfirmed && hash && (
        <p className={styles.success}>
          ✅ Confirmed!{' '}
          <a href={explorerUrl!} target="_blank" rel="noopener noreferrer">
            View on explorer ↗
          </a>
        </p>
      )}

      {hash && !isConfirmed && !isPending && (
        <p className={styles.info}>
          <a href={explorerUrl!} target="_blank" rel="noopener noreferrer">
            View transaction ↗
          </a>
        </p>
      )}

      {error && (
        <p className={styles.error}>
          ❌ Error: {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}

