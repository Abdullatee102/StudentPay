import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useWallet } from '@/hooks/useWallet'
import { useGetDealsForAddress, useGetDeal } from '@/hooks/useEscrow'
import DealStatusBadge from '@/components/DealStatusBadge'
import { DealStatus } from '@/contracts/types'
import styles from './MyDeals.module.css'
import '@/styles/components.css'

// ── Single deal row (fetches own data) ────────────────────────────────────────
function DealRow({ dealId, viewerAddress }: { dealId: bigint; viewerAddress: string }) {
  const { data: deal, isLoading } = useGetDeal(dealId)

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className={styles.loading}>Loading deal #{dealId.toString()}…</td>
      </tr>
    )
  }
  if (!deal) return null

  const isBuyer  = deal.buyer.toLowerCase()  === viewerAddress.toLowerCase()
  const deadline = new Date(Number(deal.deadline) * 1000)

  return (
    <tr className={styles.row}>
      <td>
        <span className={styles.dealId}>{deal.id.toString()}</span>
      </td>
      <td>
        <span className={styles.role}>{isBuyer ? '🛒 Buyer' : '🔨 Seller'}</span>
      </td>
      <td className={styles.description} title={deal.description}>
        {deal.description.length > 50
          ? `${deal.description.slice(0, 50)}…`
          : deal.description}
      </td>
      <td className={styles.amount}>{formatEther(deal.amount)} BOT</td>
      <td><DealStatusBadge status={deal.status as DealStatus} /></td>
      <td className={styles.deadline}>{deadline.toLocaleDateString()}</td>
      <td className={styles.actionCell}>
        <Link to={`/deals/${deal.id.toString()}`} className={styles.viewButton}>
          View
        </Link>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyDeals() {
  const { isConnected, address } = useWallet()
  const { data: dealIds, isLoading, error } = useGetDealsForAddress(address)

  if (!isConnected) {
    return (
      <div className={styles.empty}>
        <p>Connect your wallet to see your deals.</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className={styles.empty}><p>Loading your deals…</p></div>
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <p style={{ color: 'var(--colour-danger)' }}>
          Error loading deals. Is the contract deployed?
        </p>
      </div>
    )
  }

  if (!dealIds || dealIds.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Deals</h1>
          <Link to="/create" className="btn btn-primary">+ Create a Deal</Link>
        </div>
        <div className="card">
          <p className={styles.emptyMsg}>
            You have no deals yet.{' '}
            <Link to="/create">Create your first deal →</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Deals</h1>
        <Link to="/create" className="btn btn-primary">+ Create a Deal</Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Role</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {dealIds.map((id) => (
              <DealRow key={id.toString()} dealId={id} viewerAddress={address!} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

