// ─────────────────────────────────────────────────────────────────────────────
// DealStatusBadge — displays a coloured pill for a deal's status
// ─────────────────────────────────────────────────────────────────────────────
import { DealStatus, DEAL_STATUS_LABELS, DEAL_STATUS_COLOURS } from '@/contracts/types'
import styles from './DealStatusBadge.module.css'

interface Props {
  status: DealStatus
}

export default function DealStatusBadge({ status }: Props) {
  const label  = DEAL_STATUS_LABELS[status] ?? 'Unknown'
  const colour = DEAL_STATUS_COLOURS[status] ?? '#64748b'

  return (
    <span
      className={styles.badge}
      style={{ backgroundColor: `${colour}22`, color: colour, borderColor: `${colour}55` }}
    >
      {label}
    </span>
  )
}

