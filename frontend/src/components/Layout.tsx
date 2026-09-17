import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import WalletConnect from './WalletConnect'
import NetworkGuard from './NetworkGuard'
import styles from './Layout.module.css'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.logo} onClick={closeMenu}>
            <span className={styles.logoMark}>⛓</span>
            <span>BotStudentPay</span>
          </NavLink>

          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="primary-navigation"
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
            onClick={closeMenu}
          >
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

          <div className={styles.wallet}><WalletConnect /></div>
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
          BotStudentPay Escrow · Powered by{' '}
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

