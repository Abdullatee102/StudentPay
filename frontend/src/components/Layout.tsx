import { Outlet, NavLink } from 'react-router-dom'
import WalletConnect from './WalletConnect'
import NetworkGuard from './NetworkGuard'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <NavLink to="/" className={styles.logo}>
              <span className={styles.logoMark}>⛓</span>
              <span>StudentPay</span>
            </NavLink>
            <WalletConnect />
          </div>

          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/my-deals"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              My Deals
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              + New Deal
            </NavLink>
            <NavLink
              to="/whitepaper"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              📄 Whitepaper & Deck
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <NetworkGuard>
          <Outlet />
        </NetworkGuard>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span>StudentPay Escrow · Peer-to-peer crypto escrow</span>
            <span className={styles.footerDot}>·</span>
            <NavLink to="/whitepaper" className={styles.footerLink}>
              Whitepaper & Pitch Deck
            </NavLink>
          </div>

          <div className={styles.footerEcosystem}>
            <span className={styles.ecosystemLabel}>Ecosystem:</span>
            <div className={styles.botChainBadge}>
              <img
                src="/botchain-logo.png"
                alt="BOT Chain Logo"
                className={styles.botChainLogo}
                width={18}
                height={18}
              />
              <span className={styles.botChainName}>BOT Chain</span>
            </div>
            <span className={styles.footerDot}>·</span>
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              BOT Chain Website
            </a>
            <span className={styles.footerDot}>·</span>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              BOT Chain Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
