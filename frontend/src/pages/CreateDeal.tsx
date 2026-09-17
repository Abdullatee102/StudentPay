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
        Lock funds in escrow and release them only when work is delivered.
      </p>

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
            Deadline
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
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description of Work
          </label>
          <textarea
            className={`form-input ${styles.textarea}`}
            id="description"
            name="description"
            placeholder="E.g. Design a logo for my student society — 3 concepts, 2 revisions included."
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

