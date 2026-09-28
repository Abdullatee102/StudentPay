// ─────────────────────────────────────────────────────────────────────────────
// ProtectedPreviewModal — Production-grade protected preview & unlocked asset viewer
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'
import type { DeliverablePackage } from '@/utils/deliverableStore'
import { shortenAddress } from '@/utils/format'
import styles from './ProtectedPreviewModal.module.css'

interface ProtectedPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  deliverable: DeliverablePackage | null
  dealId: string
  buyerAddress?: string
  isUnlocked: boolean
}

export default function ProtectedPreviewModal({
  isOpen,
  onClose,
  deliverable,
  dealId,
  buyerAddress = '',
  isUnlocked,
}: ProtectedPreviewModalProps) {
  if (!isOpen || !deliverable) return null

  const watermarkText = `STUDENTPAY • PREVIEW ONLY • DEAL #${dealId} • BUYER: ${shortenAddress(buyerAddress)}`
  const dateString = new Date(deliverable.submittedAt).toLocaleDateString()

  // Prevent right click / context menu on protected deliverables
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isUnlocked) {
      e.preventDefault()
    }
  }

  const renderContent = () => {
    const { type, fileType, rawContent, fileName } = deliverable

    // 1. IMAGE / DESIGN
    if (type === 'file' && fileType?.startsWith('image/')) {
      return (
        <img
          src={rawContent}
          alt={fileName || 'Deliverable Preview'}
          className={styles.previewImage}
          onContextMenu={handleContextMenu}
          onDragStart={(e) => !isUnlocked && e.preventDefault()}
        />
      )
    }

    // 2. VIDEO
    if (type === 'file' && fileType?.startsWith('video/')) {
      return (
        <video
          src={rawContent}
          controls
          controlsList={!isUnlocked ? 'nodownload' : undefined}
          className={styles.previewVideo}
          onContextMenu={handleContextMenu}
        />
      )
    }

    // 3. AUDIO
    if (type === 'file' && fileType?.startsWith('audio/')) {
      return (
        <audio
          src={rawContent}
          controls
          controlsList={!isUnlocked ? 'nodownload' : undefined}
          className={styles.previewAudio}
          onContextMenu={handleContextMenu}
        />
      )
    }

    // 4. WEBSITE / DEPLOYED DEMO / URL
    if (type === 'url') {
      return (
        <iframe
          src={rawContent}
          title="Protected Website Preview"
          className={styles.previewIframe}
          sandbox="allow-scripts allow-same-origin"
        />
      )
    }

    // 5. SOURCE CODE / TEXT
    if (type === 'code' || (type === 'file' && (fileType?.includes('text') || fileType?.includes('json')))) {
      return (
        <div className={styles.codeBox} onContextMenu={handleContextMenu}>
          <code>{rawContent}</code>
        </div>
      )
    }

    // 6. GENERAL FILE / ARCHIVE / PDF
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ fontSize: '3rem', margin: 0 }}>📄</p>
        <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>{fileName || 'Submitted Document/Archive'}</p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          {isUnlocked
            ? 'Original asset is fully unlocked and ready for download below.'
            : 'Document preview active. Raw file download remains locked until payment release.'}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span>{isUnlocked ? '🔓' : '👁️'}</span>
            <span>{isUnlocked ? 'Unlocked Deliverable' : 'Protected Deliverable Preview'} — Deal #{dealId}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Security Banner */}
        <div className={`${styles.banner} ${isUnlocked ? styles.bannerUnlocked : styles.bannerLocked}`}>
          <span>
            {isUnlocked
              ? '✅ Payment Released: You have full access to the original deliverable.'
              : '🛡️ Protected Inspection Mode: Original downloadable deliverable is locked until payment is released.'}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            Hash: {deliverable.commitmentHash.slice(0, 10)}…{deliverable.commitmentHash.slice(-6)}
          </span>
        </div>

        {/* Body */}
        <div className={styles.contentBody}>
          <div className={styles.viewerContainer}>
            {renderContent()}

            {/* Dynamic Watermark Overlay when locked */}
            {!isUnlocked && (
              <div className={styles.watermarkOverlay}>
                <div className={styles.watermarkRow}>
                  <span>{watermarkText}</span>
                  <span>{dateString}</span>
                </div>
                <div className={styles.watermarkRow}>
                  <span>STUDENTPAY ESCROW • PROTECTED PREVIEW</span>
                  <span>{watermarkText}</span>
                </div>
                <div className={styles.watermarkRow}>
                  <span>{watermarkText}</span>
                  <span>STUDENTPAY PREVIEW ONLY</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes from seller */}
          {deliverable.notes && (
            <div className={styles.notesCard}>
              <p className={styles.notesTitle}>Seller Supplementary Note</p>
              <p className={styles.notesText}>{deliverable.notes}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className={styles.metaRow}>
            <span>Submitted: {new Date(deliverable.submittedAt).toLocaleString()}</span>
            <span>Type: {deliverable.type.toUpperCase()} {deliverable.fileType ? `(${deliverable.fileType})` : ''}</span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {!isUnlocked ? (
            <>
              <div className={styles.lockedText}>
                <span>🔒 Original Deliverable Download: <strong>LOCKED</strong></span>
              </div>
              <button className="btn btn-secondary" onClick={onClose}>
                Close Inspection
              </button>
            </>
          ) : (
            <>
              <span style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>
                🎉 Deliverable Unlocked!
              </span>
              <a
                href={deliverable.rawContent}
                download={deliverable.fileName || `deliverable_deal_${dealId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-primary ${styles.downloadBtn}`}
              >
                📥 Download Original Deliverable
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
