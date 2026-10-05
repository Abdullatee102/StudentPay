import styles from './Whitepaper.module.css'
import '@/styles/components.css'

export default function Whitepaper() {
  const openStaticHtml = () => {
    window.open('/docs/studentpay-whitepaper.html', '_blank')
  }

  const openPdf = () => {
    window.open('/docs/studentpay-whitepaper.pdf', '_blank')
  }

  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Student<span className={styles.accent}>Pay</span> Whitepaper & Pitch Deck
          </h1>
          <p style={{ color: 'var(--colour-text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Official V2 Product & Architectural Specification · Bohr Testnet (Chain ID 968)
          </p>
        </div>
        <div className={styles.actionRow}>
          <span className={styles.navBadge}>Verified On-Chain V2</span>
          <button className="btn btn-secondary" onClick={openStaticHtml}>
            👁️ Web / Print Version
          </button>
          <button className="btn btn-primary" onClick={openPdf}>
            📥 Download PDF
          </button>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* ── Sidebar TOC ─────────────────────────────────────────────────── */}
        <aside className={styles.tocSidebar}>
          <div className={styles.tocTitle}>Table of Contents</div>
          <a href="#sec-1" className={styles.tocLink}>1. The Problem</a>
          <a href="#sec-2" className={styles.tocLink}>2. The Opportunity</a>
          <a href="#sec-3" className={styles.tocLink}>3. The Solution</a>
          <a href="#sec-4" className={styles.tocLink}>4. 5-Step Workflow</a>
          <a href="#sec-5" className={styles.tocLink}>5. Implemented Features</a>
          <a href="#sec-6" className={styles.tocLink}>6. User Journey</a>
          <a href="#sec-7" className={styles.tocLink}>7. Technical Architecture</a>
          <a href="#sec-8" className={styles.tocLink}>8. Technology Stack</a>
          <a href="#sec-9" className={styles.tocLink}>9. Blockchain Layer</a>
          <a href="#sec-10" className={styles.tocLink}>10. Security & Trust</a>
          <a href="#sec-11" className={styles.tocLink}>11. Value Proposition</a>
          <a href="#sec-12" className={styles.tocLink}>12. Competitive Advantage</a>
          <a href="#sec-13" className={styles.tocLink}>13. Product Status</a>
          <a href="#sec-14" className={styles.tocLink}>14. Roadmap</a>
          <a href="#sec-15" className={styles.tocLink}>15. Conclusion</a>
        </aside>

        {/* ── Main Document Body ─────────────────────────────────────────── */}
        <main className={styles.contentArea}>
          {/* Section 1 */}
          <section id="sec-1" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>⚠️</span> 1. The Problem
            </h2>
            <div className={styles.sectionBody}>
              <p>
                Students frequently exchange services with peers for academic tutoring, graphic design, software development, video editing, essay proofreading, and campus event organization. These informal agreements carry severe risks:
              </p>
              <ul>
                <li><strong>Upfront Payment Risk:</strong> Buyers pay upfront and sellers ghost or deliver substandard work.</li>
                <li><strong>Post-Delivery Non-Payment:</strong> Sellers deliver completed assets, but buyers refuse to pay.</li>
                <li><strong>Work-Stealing Vulnerability:</strong> In digital transactions, buyers often demand previews, steal raw source files or designs, and decline payment.</li>
                <li><strong>Centralized Intermediary Overhead:</strong> Traditional escrow services charge heavy commissions (10%–20%), require identity verification (KYC), and rely on centralized databases vulnerable to censorship or server downtime.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section id="sec-2" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>💡</span> 2. The Opportunity
            </h2>
            <div className={styles.sectionBody}>
              <p>
                Higher education campuses host vibrant micro-economies. A decentralized, zero-commission escrow platform enables students to monetize skills safely without trusting unknown peers.
              </p>
              <p>
                By leveraging smart contracts on an EVM-compatible blockchain (Bohr Testnet), StudentPay transforms peer agreements into self-executing, mathematically guaranteed escrows requiring zero custodial trust.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="sec-3" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🛡️</span> 3. The StudentPay Solution
            </h2>
            <div className={styles.sectionBody}>
              <p>
                StudentPay eliminates counterparty risk using non-custodial smart contracts, cryptographic commitments, and dual-level deliverable access control:
              </p>
              <div className={styles.cardGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureCardTitle}>Zero Centralized Backend</div>
                  <div className={styles.featureCardDesc}>No Express server, PostgreSQL, or Supabase. The smart contract on Bohr Testnet handles all business logic and state.</div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureCardTitle}>Blinded Proof Commitments</div>
                  <div className={styles.featureCardDesc}>Sellers submit a cryptographic hash (<span className={styles.codeBadge}>keccak256</span>) of their deliverable before the deadline to prevent work-stealing and late submissions.</div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureCardTitle}>Protected Preview Inspection</div>
                  <div className={styles.featureCardDesc}>Buyers inspect watermarked previews (<span className={styles.codeBadge}>STUDENTPAY • PREVIEW ONLY</span>) to verify quality while usable originals remain locked.</div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureCardTitle}>Anti-Ghosting Safeguard</div>
                  <div className={styles.featureCardDesc}>Sellers claim automatic 100% payouts if the 48-hour review window expires without buyer dispute.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="sec-4" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>⚙️</span> 4. How StudentPay Works (5-Step Core Flow)
            </h2>
            <div className={styles.sectionBody}>
              <div className={styles.diagramContainer}>
1. CREATE DEAL ──────► 2. SELLER SUBMITS ──────► 3. BUYER INSPECTS ──────► 4. ACCEPT / DISPUTE ──────► 5. DELIVERABLE UNLOCKS
(Buyer locks BOT)    (Commitment Hash)     (Protected Preview)     (Instant Payout/Refund)    (Original Asset Active)
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="sec-5" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🚀</span> 5. Core Implemented Features
            </h2>
            <div className={styles.sectionBody}>
              <ul>
                <li><strong>Blinded Proof Commitment:</strong> Computes <span className={styles.codeBadge}>keccak256</span> hashes of deliverables on-chain before deadlines.</li>
                <li><strong>Dual-Level Protected Access:</strong> Generates watermarked previews for images, video, audio, code, and web apps while locking original files.</li>
                <li><strong>48-Hour Review Window:</strong> Provides buyers 48 hours to inspect work or flag disputes before auto-release triggers.</li>
                <li><strong>Anti-Ghosting Payout:</strong> Guarantees seller payment if buyers become unresponsive post-delivery.</li>
                <li><strong>Deadline Refund Protection:</strong> Grants buyers immediate 100% refunds if sellers miss submission deadlines.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="sec-6" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>👤</span> 6. User Journey
            </h2>
            <div className={styles.sectionBody}>
              <h3>Buyer (Client) Journey</h3>
              <p>1. Connects wallet ➔ 2. Creates & funds deal on-chain ➔ 3. Receives deliverable notification ➔ 4. Views watermarked protected preview ➔ 5. Accepts & releases funds ➔ 6. Downloads unlocked original deliverable.</p>

              <h3>Seller (Provider) Journey</h3>
              <p>1. Connects wallet ➔ 2. Accepts deal ➔ 3. Submits deliverable & commits hash on-chain before deadline ➔ 4. Monitors 48h review window ➔ 5. Receives instant payment or claims auto-release.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="sec-7" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🏛️</span> 7. Technical Architecture
            </h2>
            <div className={styles.sectionBody}>
              <div className={styles.diagramContainer}>
┌───────────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER (Frontend)                     │
│  React 18 · Vite · TypeScript · wagmi 2.x · viem · Reown AppKit   │
│  deliverableStore (IndexedDB) · ProtectedPreviewModal             │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ JSON-RPC (Bohr Testnet)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER (Chain ID: 968)                │
│  StudentPayEscrow.sol (0x7591428059DcAD6De8D51177080959F8B347603D)│
└───────────────────────────────────────────────────────────────────┘
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="sec-8" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>💻</span> 8. Technology Stack
            </h2>
            <div className={styles.sectionBody}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Layer</th><th>Technology Used</th></tr>
                </thead>
                <tbody>
                  <tr><td>Frontend Framework</td><td>React 18, Vite 6, TypeScript 5.6, react-router-dom 6</td></tr>
                  <tr><td>Web3 Provider</td><td>wagmi 2.13, viem 2.21, Reown AppKit 1.6 (WalletConnect v3)</td></tr>
                  <tr><td>Smart Contract</td><td>Solidity 0.8.24, Foundry / Forge Framework</td></tr>
                  <tr><td>Network</td><td>Bohr Testnet (Chain ID 968, BOT Native Token)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 9 */}
          <section id="sec-9" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🔗</span> 9. Blockchain & Web3 Layer
            </h2>
            <div className={styles.sectionBody}>
              <p><strong>Why Blockchain?</strong> Blockchain guarantees that escrow funds cannot be seized, altered, or misappropriated by any centralized entity. Settlement rules are immutable once deployed.</p>
              <p><strong>On-Chain Data:</strong> Deal ID, buyer address, seller address, locked BOT amount, deadline timestamp, status enum, commitment hash (<span className={styles.codeBadge}>bytes32</span>), submission timestamp, grace window expiration timestamp.</p>
              <p><strong>Off-Chain Data:</strong> Raw file bytes / Data URLs, supplementary notes, and watermarked preview payloads stored locally via <span className={styles.codeBadge}>deliverableStore.ts</span>.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="sec-10" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🔒</span> 10. Security & Trust Mechanisms
            </h2>
            <div className={styles.sectionBody}>
              <ul>
                <li><strong>Non-Custodial Architecture:</strong> Smart contract holds funds; no admin key, owner backdoor, or upgrade proxy exists.</li>
                <li><strong>Reentrancy Protection:</strong> All fund transfers are guarded by custom <span className={styles.codeBadge}>nonReentrant</span> state locks.</li>
                <li><strong>Anti-Work-Stealing:</strong> Deliverables remain protected by dynamic client-side watermarks (<span className={styles.codeBadge}>STUDENTPAY • PREVIEW ONLY • BUYER: 0x...</span>) until payment is released.</li>
              </ul>
            </div>
          </section>

          {/* Section 11 */}
          <section id="sec-11" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>💎</span> 11. Business & Value Proposition
            </h2>
            <div className={styles.sectionBody}>
              <p><strong>For Student Buyers:</strong> Inspect work before payment; full refund guarantee if deadlines or requirements are missed.</p>
              <p><strong>For Student Sellers:</strong> Guaranteed payment for valid work; anti-ghosting auto-release after 48 hours; zero platform fees.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="sec-12" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>⚡</span> 12. Differentiating Advantages
            </h2>
            <div className={styles.sectionBody}>
              <p><strong>1. Protected Preview Inspection:</strong> Unlike primitive escrows that force blind payments, StudentPay lets buyers visually/functionally inspect work via watermarked previews.</p>
              <p><strong>2. Zero Server Overhead:</strong> Operates 100% client-to-chain. No database server costs, API outages, or centralized authentication vulnerabilities.</p>
            </div>
          </section>

          {/* Section 13 */}
          <section id="sec-13" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>📊</span> 13. Current Product Status
            </h2>
            <div className={styles.sectionBody}>
              <p><strong>Smart Contract:</strong> Fully deployed V2 contract on Bohr Testnet at <span className={styles.codeBadge}>0x7591428059DcAD6De8D51177080959F8B347603D</span>.</p>
              <p><strong>Test Suite:</strong> 21 passing unit & integration tests (<span className={styles.codeBadge}>forge test</span>).</p>
              <p><strong>Frontend DApp:</strong> Fully built, production-compiled, and deployed on Vercel at <span className={styles.codeBadge}>https://student-pay-rcpc.vercel.app</span>.</p>
            </div>
          </section>

          {/* Section 14 */}
          <section id="sec-14" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🗺️</span> 14. Product Roadmap
            </h2>
            <div className={styles.sectionBody}>
              <p><strong>Phase 1 (Completed):</strong> Core V2 escrow, blinded proof commitments, 48h review window, auto-release, and protected preview system on Bohr Testnet.</p>
              <p><strong>Phase 2 (Planned):</strong> Decentralized IPFS deliverable storage integration with client-side encryption.</p>
              <p><strong>Phase 3 (Planned):</strong> Multi-token ERC-20 stablecoin support (USDT/USDC).</p>
              <p><strong>Phase 4 (Planned):</strong> On-chain student reputation & verifiable completion badges.</p>
            </div>
          </section>

          {/* Section 15 */}
          <section id="sec-15" className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <span>🎯</span> 15. Conclusion & Call to Action
            </h2>
            <div className={styles.sectionBody}>
              <p>
                StudentPay proves that peer-to-peer student service exchanges can be secure, trustless, and zero-fee. By combining smart contract escrows with protected preview verification, StudentPay solves the fundamental dilemma of digital service delivery: <strong>preventing work-stealing while ensuring buyer satisfaction.</strong>
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="https://scan.bohr.life/address/0x7591428059DcAD6De8D51177080959F8B347603D" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  🔍 View Contract on Bohr Explorer
                </a>
                <button className="btn btn-primary" onClick={openPdf}>
                  📥 Download PDF
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
