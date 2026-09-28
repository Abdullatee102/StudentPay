import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'
import { useCreateDeal } from '@/hooks/useEscrow'
import TxStatus from '@/components/TxStatus'
import type { CreateDealInput } from '@/contracts/types'
import styles from './CreateDeal.module.css'
import '@/styles/components.css'

export default function CreateDeal() {
  const { isConnected } = useWallet()
  const { createDeal, hash, isPending, error, receipt } = useCreateDeal()
  const navigate = useNavigate()

  const [form, setForm] = useState<CreateDealInput>({
    sellerAddress: '',
    amountEth:     '',
    deadlineDate:  '',
    description:   '',
  })

  const [validationError, setValidationError] = useState<string | null>(null)

  // Redirect after tx confirmed
  if (receipt.isSuccess) {
    setTimeout(() => navigate('/my-deals'), 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setValidationError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.sellerAddress.startsWith('0x') || form.sellerAddress.length !== 42) {
      return setValidationError('Enter a valid Ethereum address for the seller.')
    }
    if (isNaN(parseFloat(form.amountEth)) || parseFloat(form.amountEth) <= 0) {
      return setValidationError('Amount must be a positive number.')
    }
    if (!form.deadlineDate) {
      return setValidationError('Please select a deadline.')
    }
    if (new Date(form.deadlineDate).getTime() <= Date.now()) {
      return setValidationError('Deadline must be in the future.')
    }
    if (!form.description.trim()) {
      return setValidationError('Please describe the work being agreed upon.')
    }

    createDeal(form)
  }

  if (!isConnected) {
    return (
      <div className={styles.connectPrompt}>
        <p>Please connect your wallet to create a deal.</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Create a New Deal</h1>
      <p className={styles.subtitle}>
        Lock funds in a trustless escrow protected by cryptographic commitments and review windows.
      </p>

      {/* ── Instructional Security Guardrails ─────────────────────────────── */}
      <div className={styles.guardrailCard}>
        <div className={styles.guardrailHeader}>
          <span className={styles.guardrailIcon}>🛡️</span>
          <h3 className={styles.guardrailTitle}>How V2 Escrow Protects You</h3>
        </div>
        <ul className={styles.guardrailList}>
          <li>
            <strong>Blinded Proof Commitments:</strong> Sellers commit a cryptographic hash of their deliverable on-chain. Deliverables cannot be stolen by clients before payment.
          </li>
          <li>
            <strong>Strict Submission Deadline:</strong> Sellers must submit their proof commitment before the agreed deadline. If missed, the review window is disabled and the buyer can claim an instant 100% refund.
          </li>
          <li>
            <strong>48-Hour Review & Dispute Window:</strong> Buyers have 48 hours to inspect work or open a dispute for a full refund. If the buyer is unresponsive, the seller is protected by automatic release.
          </li>
        </ul>
      </div>

      <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="sellerAddress">
            Seller Wallet Address
          </label>
          <input
            className="form-input"
            id="sellerAddress"
            name="sellerAddress"
            placeholder="0x…"
            value={form.sellerAddress}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="amountEth">
            Payment Amount (BOT)
          </label>
          <input
            className="form-input"
            id="amountEth"
            name="amountEth"
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.5"
            value={form.amountEth}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="deadlineDate">
            Submission Deadline
          </label>
          <input
            className="form-input"
            id="deadlineDate"
            name="deadlineDate"
            type="datetime-local"
            value={form.deadlineDate}
            onChange={handleChange}
            required
          />
          <span className={styles.fieldHint}>
            Seller must submit proof before this exact timestamp to activate the review window.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description of Work & Requirements
          </label>
          <textarea
            className={`form-input ${styles.textarea}`}
            id="description"
            name="description"
            placeholder="Specify clear requirements, deliverables, and acceptance criteria."
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        {validationError && (
          <p className={styles.validationError}>⚠️ {validationError}</p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || receipt.isLoading}
        >
          {isPending ? 'Confirm in Wallet…' : 'Create Deal'}
        </button>
      </form>

      <TxStatus
        hash={hash}
        isPending={receipt.isLoading}
        isConfirmed={receipt.isSuccess}
        error={error}
        label="Creating deal"
      />
    </div>
  )
}
