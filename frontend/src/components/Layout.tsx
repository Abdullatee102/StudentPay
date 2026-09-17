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
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoMark}>⛓</span>
            <span>StudentPay</span>
          </NavLink>

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
          </nav>

          <WalletConnect />
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
        <p>
          StudentPay Escrow · Powered by{' '}
          <a
            href="https://scan.bohr.life"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bohr Testnet
          </a>
        </p>
      </footer>
    </div>
  )
}

