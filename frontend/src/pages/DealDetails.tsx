import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useWallet } from '@/hooks/useWallet'
import {
  useGetDeal,
  useFundDeal,
  useSubmitProof,
  useRevealProof,
  useReleaseFunds,
  useOpenDispute,
  useClaimAutoRelease,
  useClaimRefund,
  useCancelDeal,
} from '@/hooks/useEscrow'
import DealStatusBadge from '@/components/DealStatusBadge'
import TxStatus from '@/components/TxStatus'
import ProtectedPreviewModal from '@/components/ProtectedPreviewModal'
import { DealStatus } from '@/contracts/types'
import { NETWORK_CONFIG } from '@/config/chains'
import {
  saveDeliverable,
  getDeliverable,
  generateDeliverableHash,
  type DeliverablePackage,
  type DeliverableType,
} from '@/utils/deliverableStore'
import styles from './DealDetails.module.css'
import '@/styles/components.css'

export default function DealDetails() {
  const { dealId } = useParams<{ dealId: string }>()
  const { address } = useWallet()

  const { data: deal, isLoading, refetch } = useGetDeal(
    dealId ? BigInt(dealId) : undefined
  )

  // Seller submission state
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('file')
  const [fileData, setFileData] = useState<{ name: string; type: string; size: number; base64: string } | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [optionalNotes, setOptionalNotes] = useState('')
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  // Deliverable package & Modal state
  const [deliverablePkg, setDeliverablePkg] = useState<DeliverablePackage | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isReleaseConfirmOpen, setIsReleaseConfirmOpen] = useState(false)

  // Reveal input
  const [revealInput, setRevealInput] = useState('')

  // Hooks
  const fundHook        = useFundDeal()
  const submitProofHook = useSubmitProof()
  const revealProofHook = useRevealProof()
  const releaseHook     = useReleaseFunds()
  const disputeHook     = useOpenDispute()
  const autoReleaseHook = useClaimAutoRelease()
  const refundHook      = useClaimRefund()
  const cancelHook      = useCancelDeal()

  // Fetch deliverable package from client storage if available
  useEffect(() => {
    if (dealId && deal?.commitmentHash) {
      getDeliverable(dealId, deal.commitmentHash).then((pkg) => {
        if (pkg) setDeliverablePkg(pkg)
      })
    }
  }, [dealId, deal?.commitmentHash])

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

  const deadline       = Number(deal.deadline)
  const deadlinePassed = now >= deadline

  const submittedAt    = Number(deal.submittedAt)
  const graceEndsAt    = Number(deal.graceEndsAt)
  const isGraceActive  = status === DealStatus.WORK_SUBMITTED && now <= graceEndsAt
  const isGraceExpired = status === DealStatus.WORK_SUBMITTED && now > graceEndsAt
  const isUnlocked     = status === DealStatus.RELEASED

  const hasCommitment =
    deal.commitmentHash &&
    deal.commitmentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'

  const explorerAddress = (addr: string) =>
    `${NETWORK_CONFIG.explorerUrl}${NETWORK_CONFIG.explorerAddressPath}${addr}`

  const handleSuccess = () => {
    setTimeout(() => refetch(), 1500)
  }

  const formatRemainingTime = (targetSeconds: number) => {
    const diff = targetSeconds - now
    if (diff <= 0) return '0h 0m'
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Handle File upload conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmissionError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 25 * 1024 * 1024) {
      setSubmissionError('File size exceeds 25MB limit.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileData({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  // Validate and submit deliverable
  const handleSubmitDeliverable = async () => {
    setSubmissionError(null)
    let rawContent = ''

    if (deliverableType === 'file') {
      if (!fileData) {
        setSubmissionError('Please select an actual deliverable file.')
        return
      }
      rawContent = fileData.base64
    } else if (deliverableType === 'url') {
      if (!urlInput.trim() || !urlInput.includes('.')) {
        setSubmissionError('Please enter a valid deliverable URL or repository link.')
        return
      }
      rawContent = urlInput.trim()
    } else if (deliverableType === 'code') {
      if (!codeInput.trim() || codeInput.trim().length < 15) {
        setSubmissionError('Please provide substantial source code or digital asset content (minimum 15 characters).')
        return
      }
      rawContent = codeInput.trim()
    }

    // Generate keccak256 commitment hash directly from actual deliverable content
    const hash = generateDeliverableHash(rawContent)

    const pkg: DeliverablePackage = {
      dealId: deal.id.toString(),
      commitmentHash: hash,
      type: deliverableType,
      fileName: fileData?.name,
      fileType: fileData?.type,
      fileSize: fileData?.size,
      rawContent,
      notes: optionalNotes.trim() || undefined,
      submittedAt: Date.now(),
    }

    // Save package locally first
    await saveDeliverable(pkg)
    setDeliverablePkg(pkg)

    // Submit commitment hash on-chain
    submitProofHook.submitProof(deal.id, hash)
    handleSuccess()
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

      {/* ── Status Banners ─────────────────────────────────────────────────── */}
      {status === DealStatus.WORK_SUBMITTED && isGraceActive && (
        <div className={styles.reviewBanner}>
          <div className={styles.bannerHeader}>
            <span className={styles.bannerIcon}>⏱️</span>
            <div>
              <h3 className={styles.bannerTitle}>48-Hour Review & Dispute Window Active</h3>
              <p className={styles.bannerSub}>
                Work was submitted on time. Review window ends in{' '}
                <strong>{formatRemainingTime(graceEndsAt)}</strong> (
                {new Date(graceEndsAt * 1000).toLocaleString()}).
              </p>
            </div>
          </div>
          <p className={styles.bannerExplanation}>
            {isBuyer
              ? 'Please inspect the protected preview of the work. You can release funds now if satisfied, or dispute before the window closes if work does not meet requirements. If you take no action, the seller can claim auto-release when time expires.'
              : 'The buyer is currently reviewing your deliverable. If the buyer accepts, funds release immediately. If they do not respond within 48 hours, you can claim an automatic payout.'}
          </p>
        </div>
      )}

      {status === DealStatus.WORK_SUBMITTED && isGraceExpired && (
        <div className={styles.autoReleaseReadyBanner}>
          <span className={styles.bannerIcon}>🎉</span>
          <div>
            <h3 className={styles.bannerTitle}>Review Window Expired (Auto-Release Eligible)</h3>
            <p className={styles.bannerSub}>
              The 48-hour grace period has expired without buyer dispute. The seller can now safely claim payment.
            </p>
          </div>
        </div>
      )}

      {status === DealStatus.FUNDED && deadlinePassed && (
        <div className={styles.deadlinePassedBanner}>
          <span className={styles.bannerIcon}>⚠️</span>
          <div>
            <h3 className={styles.bannerTitle}>Seller Submission Deadline Passed</h3>
            <p className={styles.bannerSub}>
              The seller failed to submit proof before the deadline. The 48-hour grace period is disabled, and the buyer is entitled to an immediate 100% refund.
            </p>
          </div>
        </div>
      )}

      {status === DealStatus.DISPUTED && (
        <div className={styles.disputeBanner}>
          <span className={styles.bannerIcon}>⚖️</span>
          <div>
            <h3 className={styles.bannerTitle}>Deal Flagged in Dispute</h3>
            <p className={styles.bannerSub}>
              The buyer opened a dispute within the 48-hour review window. Automatic release is stopped, and the buyer can claim a refund. Original deliverable remains locked.
            </p>
          </div>
        </div>
      )}

      {/* ── BUYER INSPECTION: Deliverable Ready Card (BUYER ONLY) ──────────── */}
      {isBuyer && status === DealStatus.WORK_SUBMITTED && (
        <div className={styles.deliverableReviewCard}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: '1.75rem' }}>📦</span>
            <div>
              <h3 className={styles.cardTitle}>DELIVERABLE READY FOR REVIEW</h3>
              <p className={styles.cardSub}>
                The seller has submitted the agreed work. You can inspect a protected preview before deciding whether to accept.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className={styles.previewBtn}
              onClick={() => setIsPreviewOpen(true)}
            >
              👁️ VIEW PROTECTED PREVIEW
            </button>
            <span className={styles.lockedNotice}>
              🔒 The original/usable deliverable remains locked until payment is released.
            </span>
          </div>
        </div>
      )}

      {/* ── UNLOCKED DELIVERABLE CARD (Post Payment Release - BUYER ONLY) ── */}
      {isBuyer && isUnlocked && (
        <div className={styles.deliverableUnlockedCard}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: '1.75rem' }}>🎉</span>
            <div>
              <h3 className={styles.cardTitle}>DELIVERABLE UNLOCKED</h3>
              <p className={styles.cardSub}>
                Payment has been successfully released to the seller. The original deliverable is now fully accessible.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className={styles.unlockBtn}
              onClick={() => setIsPreviewOpen(true)}
            >
              🔓 Open / Download Original Deliverable
            </button>
          </div>
        </div>
      )}

      {/* ── Deal info card ─────────────────────────────────────────────────── */}
      <div className={`card ${styles.infoGrid}`}>
        <div>
          <p className={styles.fieldLabel}>Required Work & Description</p>
          <p className={styles.description}>{deal.description}</p>
        </div>

        <div className={styles.metaGrid}>
          <div>
            <p className={styles.fieldLabel}>Amount</p>
            <p className={styles.amount}>{formatEther(deal.amount)} BOT</p>
          </div>
          <div>
            <p className={styles.fieldLabel}>Submission Deadline</p>
            <p className={deadlinePassed && status === DealStatus.FUNDED ? styles.deadlinePassed : ''}>
              {new Date(deadline * 1000).toLocaleString()}
              {deadlinePassed && ' (passed)'}
            </p>
          </div>
          <div>
            <p className={styles.fieldLabel}>Created At</p>
            <p>{new Date(Number(deal.createdAt) * 1000).toLocaleString()}</p>
          </div>
        </div>

        {/* ── Blinded Proof & Commitment Details ──────────────────────────── */}
        {hasCommitment && (
          <div className={styles.proofCard}>
            <div className={styles.proofHeader}>
              <span className={styles.proofTag}>🛡️ Blinded Proof Commitment</span>
              <span className={styles.proofTime}>
                Submitted {new Date(submittedAt * 1000).toLocaleTimeString()} on{' '}
                {new Date(submittedAt * 1000).toLocaleDateString()}
              </span>
            </div>
            <p className={styles.proofHelp}>
              The seller submitted a cryptographic hash before the deadline. Work cannot be stolen or retroactively altered.
            </p>
            <div className={styles.hashBox}>
              <span className={styles.hashLabel}>keccak256:</span>
              <code className={styles.hashCode}>{deal.commitmentHash}</code>
            </div>

            {deal.proofPreimage ? (
              <div className={styles.revealedProofBox}>
                <span className={styles.revealedLabel}>🔓 Unblinded Deliverable On-Chain:</span>
                <p className={styles.revealedText}>{deal.proofPreimage}</p>
              </div>
            ) : (
              <p className={styles.blindedNotice}>
                🔒 Raw deliverable preimage is blinded and locked on-chain.
              </p>
            )}
          </div>
        )}

        <div>
          <p className={styles.fieldLabel}>Buyer (Client)</p>
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
          <p className={styles.fieldLabel}>Seller (Provider)</p>
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

      {/* ── Actions Card ───────────────────────────────────────────────────── */}
      <div className={`card ${styles.actions}`}>
        <h2 className={styles.actionsTitle}>Available Actions</h2>

        {/* ── BUYER: Fund deal ─────────────────────────────────────────────── */}
        {isBuyer && status === DealStatus.PENDING_FUNDING && !deadlinePassed && (
          <ActionBlock
            title="Lock Funds in Escrow"
            desc="Deposit the agreed payment into the smart contract. Funds are secured on-chain."
          >
            <button
              className="btn btn-primary"
              disabled={fundHook.isPending || fundHook.receipt.isLoading}
              onClick={() => {
                fundHook.fundDeal(deal.id, deal.amount)
                handleSuccess()
              }}
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

        {/* ── BUYER: Cancel unfunded deal ──────────────────────────────────── */}
        {isBuyer && status === DealStatus.PENDING_FUNDING && (
          <ActionBlock
            title="Cancel Deal"
            desc="Cancel this deal before any funds are deposited."
          >
            <button
              className="btn btn-danger"
              disabled={cancelHook.isPending || cancelHook.receipt.isLoading}
              onClick={() => {
                cancelHook.cancelDeal(deal.id)
                handleSuccess()
              }}
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

        {/* ── SELLER: Submit Actual Deliverable & Commitment ─────────────────── */}
        {isSeller && status === DealStatus.FUNDED && !deadlinePassed && (
          <ActionBlock
            title="Submit Deliverable & Commitment"
            desc="Provide the actual deliverable artifact or verifiable link representing your work. StudentPay computes a cryptographic commitment hash from the asset to protect your submission."
          >
            <div className={styles.submissionForm}>
              <div className="form-group">
                <label className={styles.inputLabel}>Deliverable Format</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${deliverableType === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setDeliverableType('file'); setSubmissionError(null); }}
                  >
                    📁 File / Document
                  </button>
                  <button
                    type="button"
                    className={`btn ${deliverableType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setDeliverableType('url'); setSubmissionError(null); }}
                  >
                    🌐 Verifiable URL / App
                  </button>
                  <button
                    type="button"
                    className={`btn ${deliverableType === 'code' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setDeliverableType('code'); setSubmissionError(null); }}
                  >
                    💻 Source Code / Asset
                  </button>
                </div>
              </div>

              {deliverableType === 'file' && (
                <div className="form-group">
                  <label className={styles.inputLabel} htmlFor="fileInput">
                    Upload Deliverable File (Image, PDF, Video, Audio, ZIP)
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    className="form-input"
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,application/pdf,.zip,.doc,.docx"
                  />
                  {fileData && (
                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>
                      Selected: {fileData.name} ({Math.round(fileData.size / 1024)} KB)
                    </span>
                  )}
                </div>
              )}

              {deliverableType === 'url' && (
                <div className="form-group">
                  <label className={styles.inputLabel} htmlFor="urlInput">
                    Verifiable URL / Deployed Application / Demo Link
                  </label>
                  <input
                    id="urlInput"
                    className="form-input"
                    type="url"
                    placeholder="https://my-app.vercel.app or https://github.com/org/repo"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setSubmissionError(null); }}
                  />
                </div>
              )}

              {deliverableType === 'code' && (
                <div className="form-group">
                  <label className={styles.inputLabel} htmlFor="codeInput">
                    Source Code / Raw Digital Asset Content
                  </label>
                  <textarea
                    id="codeInput"
                    className="form-input"
                    rows={4}
                    placeholder="Paste source code or formatted asset content here..."
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setSubmissionError(null); }}
                  />
                </div>
              )}

              <div className="form-group">
                <label className={styles.inputLabel} htmlFor="notesInput">
                  Optional Submission Notes (Supplementary)
                </label>
                <input
                  id="notesInput"
                  className="form-input"
                  type="text"
                  placeholder="Add a short note about this submission..."
                  value={optionalNotes}
                  onChange={(e) => setOptionalNotes(e.target.value)}
                />
              </div>

              {submissionError && <p className={styles.validationMsg}>⚠️ {submissionError}</p>}

              <button
                className="btn btn-primary"
                disabled={
                  submitProofHook.isPending ||
                  submitProofHook.receipt.isLoading
                }
                onClick={handleSubmitDeliverable}
              >
                {submitProofHook.isPending
                  ? 'Confirm in Wallet…'
                  : 'Submit Deliverable & Commit On-Chain'}
              </button>
            </div>
            <TxStatus
              hash={submitProofHook.hash}
              isPending={submitProofHook.receipt.isLoading}
              isConfirmed={submitProofHook.receipt.isSuccess}
              error={submitProofHook.error}
            />
          </ActionBlock>
        )}

        {/* ── BUYER: Review Window Actions (Accept OR Dispute) ─────────────── */}
        {isBuyer && status === DealStatus.WORK_SUBMITTED && isGraceActive && (
          <div className={styles.reviewActionGroup}>
            <ActionBlock
              title="Accept & Release Payment"
              desc="If the deliverable meets your expectations after viewing the protected preview, release payment immediately to the seller."
            >
              <button
                className="btn btn-primary"
                disabled={releaseHook.isPending || releaseHook.receipt.isLoading}
                onClick={() => setIsReleaseConfirmOpen(true)}
              >
                {releaseHook.isPending ? 'Confirm in Wallet…' : 'Accept & Release Funds'}
              </button>
              <TxStatus
                hash={releaseHook.hash}
                isPending={releaseHook.receipt.isLoading}
                isConfirmed={releaseHook.receipt.isSuccess}
                error={releaseHook.error}
              />
            </ActionBlock>

            <ActionBlock
              title="Open Dispute (Refund Protection)"
              desc="If the work is missing, broken, or unsatisfactory upon inspection, flag a dispute before the 48-hour window expires. This freezes auto-release and allows you to claim a full refund."
            >
              <button
                className="btn btn-danger"
                disabled={disputeHook.isPending || disputeHook.receipt.isLoading}
                onClick={() => {
                  disputeHook.openDispute(deal.id)
                  handleSuccess()
                }}
              >
                {disputeHook.isPending ? 'Confirm in Wallet…' : 'Open Dispute & Stop Auto-Release'}
              </button>
              <TxStatus
                hash={disputeHook.hash}
                isPending={disputeHook.receipt.isLoading}
                isConfirmed={disputeHook.receipt.isSuccess}
                error={disputeHook.error}
              />
            </ActionBlock>
          </div>
        )}

        {/* ── SELLER: Claim Auto-Release (After 48h Window) ─────────────────── */}
        {isSeller && status === DealStatus.WORK_SUBMITTED && isGraceExpired && (
          <ActionBlock
            title="Claim Auto-Release Payment"
            desc="Anti-Ghosting Protection: The 48-hour review window has passed without any buyer dispute. You can now claim full payment."
          >
            <button
              className="btn btn-primary"
              disabled={autoReleaseHook.isPending || autoReleaseHook.receipt.isLoading}
              onClick={() => {
                autoReleaseHook.claimAutoRelease(deal.id)
                handleSuccess()
              }}
            >
              {autoReleaseHook.isPending
                ? 'Confirm in Wallet…'
                : `Claim ${formatEther(deal.amount)} BOT Payout`}
            </button>
            <TxStatus
              hash={autoReleaseHook.hash}
              isPending={autoReleaseHook.receipt.isLoading}
              isConfirmed={autoReleaseHook.receipt.isSuccess}
              error={autoReleaseHook.error}
            />
          </ActionBlock>
        )}

        {/* ── SELLER: Reveal Raw Proof (Optional prior to release) ─────────── */}
        {isSeller &&
          status === DealStatus.WORK_SUBMITTED &&
          !deal.proofPreimage && (
            <ActionBlock
              title="Publish Unblinded Deliverable On-Chain"
              desc="Optional: Publish the deliverable link/text on-chain. The smart contract verifies that its keccak256 matches your original commitment."
            >
              <div className={styles.submissionForm}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Paste exact deliverable text/link"
                  value={revealInput}
                  onChange={(e) => setRevealInput(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  disabled={!revealInput.trim() || revealProofHook.isPending}
                  onClick={() => {
                    revealProofHook.revealProof(deal.id, revealInput.trim())
                    handleSuccess()
                  }}
                >
                  {revealProofHook.isPending ? 'Verifying on-chain…' : 'Reveal Deliverable'}
                </button>
              </div>
              <TxStatus
                hash={revealProofHook.hash}
                isPending={revealProofHook.receipt.isLoading}
                isConfirmed={revealProofHook.receipt.isSuccess}
                error={revealProofHook.error}
              />
            </ActionBlock>
          )}

        {/* ── BUYER: Claim Refund (Seller Missed Deadline) ─────────────────── */}
        {isBuyer && status === DealStatus.FUNDED && deadlinePassed && (
          <ActionBlock
            title="Claim Immediate Full Refund"
            desc="The seller failed to submit proof before the deadline. The grace period is disabled. Claim your 100% refund immediately."
          >
            <button
              className="btn btn-danger"
              disabled={refundHook.isPending || refundHook.receipt.isLoading}
              onClick={() => {
                refundHook.claimRefund(deal.id)
                handleSuccess()
              }}
            >
              {refundHook.isPending
                ? 'Confirm in Wallet…'
                : `Claim ${formatEther(deal.amount)} BOT Refund`}
            </button>
            <TxStatus
              hash={refundHook.hash}
              isPending={refundHook.receipt.isLoading}
              isConfirmed={refundHook.receipt.isSuccess}
              error={refundHook.error}
            />
          </ActionBlock>
        )}

        {/* ── BUYER: Claim Refund (Disputed Deal) ───────────────────────────── */}
        {isBuyer && status === DealStatus.DISPUTED && (
          <ActionBlock
            title="Claim Dispute Refund"
            desc="You flagged this deal during the 48-hour review window. Withdraw your full escrow deposit."
          >
            <button
              className="btn btn-danger"
              disabled={refundHook.isPending || refundHook.receipt.isLoading}
              onClick={() => {
                refundHook.claimRefund(deal.id)
                handleSuccess()
              }}
            >
              {refundHook.isPending
                ? 'Confirm in Wallet…'
                : `Claim ${formatEther(deal.amount)} BOT Refund`}
            </button>
            <TxStatus
              hash={refundHook.hash}
              isPending={refundHook.receipt.isLoading}
              isConfirmed={refundHook.receipt.isSuccess}
              error={refundHook.error}
            />
          </ActionBlock>
        )}

        {/* ── Terminal States ──────────────────────────────────────────────── */}
        {[DealStatus.RELEASED, DealStatus.REFUNDED, DealStatus.CANCELLED].includes(status) && (
          <p className={styles.terminalMsg}>
            This deal is closed ({DealStatus[status]}). No further actions are available.
          </p>
        )}
      </div>

      {/* ── Protected Preview Modal ────────────────────────────────────────── */}
      <ProtectedPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        deliverable={deliverablePkg}
        dealId={deal.id.toString()}
        buyerAddress={deal.buyer}
        isUnlocked={isUnlocked}
      />

      {/* ── Payment Release Confirmation Modal ────────────────────────────── */}
      {isReleaseConfirmOpen && (
        <div className={styles.confirmOverlay} onClick={() => setIsReleaseConfirmOpen(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>CONFIRM PAYMENT RELEASE</h3>
            <div className={styles.confirmBody}>
              <p>You are about to release <strong>{formatEther(deal.amount)} BOT</strong> to the seller.</p>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                You have inspected the protected preview and are accepting the submitted work as satisfactory. This action is irreversible on-chain.
              </p>
            </div>
            <div className={styles.confirmButtons}>
              <button
                className="btn btn-secondary"
                onClick={() => setIsReleaseConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsReleaseConfirmOpen(false)
                  releaseHook.releaseFunds(deal.id)
                  handleSuccess()
                }}
              >
                Confirm & Release Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBlock({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.actionBlock}>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDesc}>{desc}</p>
      {children}
    </div>
  )
}
