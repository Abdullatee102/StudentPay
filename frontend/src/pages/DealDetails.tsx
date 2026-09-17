import { useParams, Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useWallet } from '@/hooks/useWallet'
import {
  useGetDeal,
  useFundDeal,
  useMarkWorkCompleted,
  useReleaseFunds,
  useClaimRefund,
  useCancelDeal,
} from '@/hooks/useEscrow'
import DealStatusBadge from '@/components/DealStatusBadge'
import TxStatus from '@/components/TxStatus'
import { DealStatus } from '@/contracts/types'
import { NETWORK_CONFIG } from '@/config/chains'
import styles from './DealDetails.module.css'
import '@/styles/components.css'

export default function DealDetails() {
  const { dealId } = useParams<{ dealId: string }>()
  const { address } = useWallet()

  const { data: deal, isLoading, refetch } = useGetDeal(
    dealId ? BigInt(dealId) : undefined
  )

  const fundHook     = useFundDeal()
  const completedHook = useMarkWorkCompleted()
  const releaseHook  = useReleaseFunds()
  const refundHook   = useClaimRefund()
  const cancelHook   = useCancelDeal()

  if (isLoading) {
    return <div className={styles.loading}>Loading deal…</div>
  }

  if (!deal) {
    return (
      <div className={styles.loading}>
        Deal #{dealId} not found. <Link to="/my-deals">Back to My Deals</Link>
      </div>
    )
  }

  const isBuyer  = address?.toLowerCase() === deal.buyer.toLowerCase()
  const isSeller = address?.toLowerCase() === deal.seller.toLowerCase()
  const status   = deal.status as DealStatus
  const now      = Math.floor(Date.now() / 1000)
  const deadline = Number(deal.deadline)
  const deadlinePassed = now >= deadline

  const explorerAddress = (addr: string) =>
    `${NETWORK_CONFIG.explorerUrl}${NETWORK_CONFIG.explorerAddressPath}${addr}`

  // After any tx is confirmed, refetch deal state
  const handleSuccess = () => {
    setTimeout(() => refetch(), 1500)
  }

  return (
    <div className={styles.root}>
      <div className={styles.breadcrumb}>
        <Link to="/my-deals">← My Deals</Link>
        <span>/ Deal #{deal.id.toString()}</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Deal #{deal.id.toString()}</h1>
        <DealStatusBadge status={status} />
      </div>

      {/* Deal info card */}
      <div className={`card ${styles.infoGrid}`}>
        <div>
          <p className={styles.fieldLabel}>Description</p>
          <p className={styles.description}>{deal.description}</p>
        </div>

        <div className={styles.metaGrid}>
          <div>
            <p className={styles.fieldLabel}>Amount</p>
            <p className={styles.amount}>{formatEther(deal.amount)} BOT</p>
          </div>
          <div>
            <p className={styles.fieldLabel}>Deadline</p>
            <p className={deadlinePassed ? styles.deadlinePassed : ''}>
              {new Date(deadline * 1000).toLocaleString()}
              {deadlinePassed && ' (passed)'}
            </p>
          </div>
          <div>
            <p className={styles.fieldLabel}>Created</p>
            <p>{new Date(Number(deal.createdAt) * 1000).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className={styles.fieldLabel}>Buyer</p>
          <a
            href={explorerAddress(deal.buyer)}
            target="_blank"
            rel="noopener noreferrer"
            className={`address ${styles.addrLink}`}
          >
            {deal.buyer}
            {isBuyer && ' (you)'}
          </a>
        </div>

        <div>
          <p className={styles.fieldLabel}>Seller</p>
          <a
            href={explorerAddress(deal.seller)}
            target="_blank"
            rel="noopener noreferrer"
            className={`address ${styles.addrLink}`}
          >
            {deal.seller}
            {isSeller && ' (you)'}
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className={`card ${styles.actions}`}>
        <h2 className={styles.actionsTitle}>Actions</h2>

        {/* BUYER: Fund */}
        {isBuyer && status === DealStatus.PENDING_FUNDING && !deadlinePassed && (
          <ActionBlock label="Fund this deal to lock payment in escrow.">
            <button
              className="btn btn-primary"
              disabled={fundHook.isPending || fundHook.receipt.isLoading}
              onClick={() => { fundHook.fundDeal(deal.id, deal.amount); handleSuccess() }}
            >
              {fundHook.isPending ? 'Confirm in Wallet…' : `Fund ${formatEther(deal.amount)} BOT`}
            </button>
            <TxStatus
              hash={fundHook.hash}
              isPending={fundHook.receipt.isLoading}
              isConfirmed={fundHook.receipt.isSuccess}
              error={fundHook.error}
            />
          </ActionBlock>
        )}

        {/* BUYER: Confirm completion */}
        {isBuyer && status === DealStatus.FUNDED && !deadlinePassed && (
          <ActionBlock label="Confirm that the seller has completed the agreed work.">
            <button
              className="btn btn-primary"
              disabled={completedHook.isPending || completedHook.receipt.isLoading}
              onClick={() => { completedHook.markCompleted(deal.id); handleSuccess() }}
            >
              {completedHook.isPending ? 'Confirm in Wallet…' : 'Confirm Completion'}
            </button>
            <TxStatus
              hash={completedHook.hash}
              isPending={completedHook.receipt.isLoading}
              isConfirmed={completedHook.receipt.isSuccess}
              error={completedHook.error}
            />
          </ActionBlock>
        )}

        {isSeller && status === DealStatus.FUNDED && !deadlinePassed && (
          <p className={styles.terminalMsg}>
            Awaiting the buyer&apos;s completion confirmation.
          </p>
        )}

        {/* BUYER: Release funds */}
        {isBuyer && status === DealStatus.COMPLETED && (
          <ActionBlock label="Confirm work is satisfactory and release payment to the seller.">
            <button
              className="btn btn-primary"
              disabled={releaseHook.isPending || releaseHook.receipt.isLoading}
              onClick={() => { releaseHook.releaseFunds(deal.id); handleSuccess() }}
            >
              {releaseHook.isPending ? 'Confirm in Wallet…' : 'Release Funds to Seller'}
            </button>
            <TxStatus
              hash={releaseHook.hash}
              isPending={releaseHook.receipt.isLoading}
              isConfirmed={releaseHook.receipt.isSuccess}
              error={releaseHook.error}
            />
          </ActionBlock>
        )}

        {/* BUYER: Claim refund after deadline */}
        {isBuyer && status === DealStatus.FUNDED && deadlinePassed && (
          <ActionBlock label="The deadline has passed without completion confirmation. You may claim a refund.">
            <button
              className="btn btn-danger"
              disabled={refundHook.isPending || refundHook.receipt.isLoading}
              onClick={() => { refundHook.claimRefund(deal.id); handleSuccess() }}
            >
              {refundHook.isPending ? 'Confirm in Wallet…' : 'Claim Refund'}
            </button>
            <TxStatus
              hash={refundHook.hash}
              isPending={refundHook.receipt.isLoading}
              isConfirmed={refundHook.receipt.isSuccess}
              error={refundHook.error}
            />
          </ActionBlock>
        )}

        {/* BUYER: Cancel unfunded deal */}
        {isBuyer && status === DealStatus.PENDING_FUNDING && (
          <ActionBlock label="Cancel this deal before it is funded.">
            <button
              className="btn btn-danger"
              disabled={cancelHook.isPending || cancelHook.receipt.isLoading}
              onClick={() => { cancelHook.cancelDeal(deal.id); handleSuccess() }}
            >
              {cancelHook.isPending ? 'Confirm in Wallet…' : 'Cancel Deal'}
            </button>
            <TxStatus
              hash={cancelHook.hash}
              isPending={cancelHook.receipt.isLoading}
              isConfirmed={cancelHook.receipt.isSuccess}
              error={cancelHook.error}
            />
          </ActionBlock>
        )}

        {/* Terminal states */}
        {[DealStatus.RELEASED, DealStatus.REFUNDED, DealStatus.CANCELLED].includes(status) && (
          <p className={styles.terminalMsg}>
            This deal is closed. No further actions are available.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Small helper component ─────────────────────────────────────────────────────
function ActionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.actionBlock}>
      <p className={styles.actionLabel}>{label}</p>
      {children}
    </div>
  )
}

