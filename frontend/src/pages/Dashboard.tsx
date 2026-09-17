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
          Peer-to-peer crypto escrow for student services — trustless, transparent, on-chain.
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
            </>
          ) : (
            <p className={styles.connectPrompt}>
              👆 Connect your wallet to get started
            </p>
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
          <p className={styles.statLabel}>Contract</p>
          <p className={styles.statValue} style={{ fontSize: '0.8rem' }}>
            {contractDeployed
              ? CONTRACT_ADDRESSES.escrow
              : 'Not yet deployed'}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
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
    title: 'Create a Deal',
    desc: 'Specify the seller, payment amount in BOT, deadline, and description of the work.',
  },
  {
    title: 'Lock Funds',
    desc: 'Send the agreed amount to the smart contract. Funds are held securely on-chain.',
  },
  {
    title: 'Work Is Delivered',
    desc: 'The seller completes the work and marks it done. The buyer confirms delivery.',
  },
  {
    title: 'Funds Released',
    desc: 'Payment is automatically sent to the seller. Or reclaim your funds if the deadline passes.',
  },
]

