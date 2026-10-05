import { Link } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'
import { useDealCount } from '@/hooks/useEscrow'
import { CONTRACT_ADDRESSES } from '@/config/chains'
import styles from './Dashboard.module.css'
import '@/styles/components.css'

export default function Dashboard() {
  const { isConnected } = useWallet()
  const { data: dealCount } = useDealCount()

  const contractDeployed = !!CONTRACT_ADDRESSES.escrow

  return (
    <div className={styles.root}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Student<span className={styles.accent}>Pay</span> Escrow
        </h1>
        <p className={styles.heroSub}>
          Peer-to-peer crypto escrow for student services — fortified with blinded proof commitments, 48-hour review windows, and anti-ghosting auto-release.
        </p>
        <div className={styles.heroCtas}>
          {isConnected ? (
            <>
              <Link to="/create" className="btn btn-primary">
                + Create a Deal
              </Link>
              <Link to="/my-deals" className="btn btn-secondary">
                My Deals
              </Link>
              <Link to="/whitepaper" className="btn btn-secondary">
                📄 View Whitepaper & Pitch Deck
              </Link>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <p className={styles.connectPrompt}>
                👆 Connect your wallet to get started
              </p>
              <Link to="/whitepaper" className="btn btn-secondary">
                📄 View Whitepaper & Pitch Deck
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className="card">
          <p className={styles.statLabel}>Total Deals Created</p>
          <p className={styles.statValue}>
            {contractDeployed
              ? (dealCount?.toString() ?? '—')
              : 'Contract not deployed'}
          </p>
        </div>
        <div className="card">
          <p className={styles.statLabel}>Network</p>
          <p className={styles.statValue}>Bohr Testnet</p>
          <p className={styles.statSub}>Chain ID: 968 · Token: BOT</p>
        </div>
        <div className="card">
          <p className={styles.statLabel}>Escrow Protection</p>
          <p className={styles.statValue} style={{ fontSize: '1.1rem', color: 'var(--colour-accent)' }}>
            Blinded Proof V2
          </p>
          <p className={styles.statSub}>48h Grace Window · Anti-Ghosting</p>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How V2 Escrow Works</h2>
        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div key={i} className={`card ${styles.step}`}>
              <div className={styles.stepNum}>{i + 1}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const STEPS = [
  {
    title: '1. Create a Deal',
    desc: 'Agree on the work, amount, deadline and terms. Buyer locks BOT tokens securely in the smart contract.',
  },
  {
    title: '2. Seller Submits',
    desc: 'The seller submits the actual work and StudentPay records a cryptographic commitment.',
  },
  {
    title: '3. Buyer Inspects',
    desc: 'The buyer can view a protected preview of the submitted work, but cannot obtain the original/usable deliverable before payment.',
  },
  {
    title: '4. Accept or Dispute',
    desc: 'The buyer accepts the work and releases payment, or opens a dispute if the requirements were not met within the 48-hour review window.',
  },
  {
    title: '5. Deliverable Unlocks',
    desc: 'After successful payment release, the original deliverable becomes available to the buyer.',
  },
]
