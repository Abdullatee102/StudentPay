// ─────────────────────────────────────────────────────────────────────────────
// deliverableStore — Client-side deliverable & protected preview persistence
// ─────────────────────────────────────────────────────────────────────────────
import { keccak256, toBytes } from 'viem'

export type DeliverableType = 'file' | 'url' | 'code'

export interface DeliverablePackage {
  dealId: string
  commitmentHash: `0x${string}`
  type: DeliverableType
  fileName?: string
  fileType?: string // mime type e.g. image/png, application/pdf, video/mp4, audio/mpeg
  fileSize?: number
  rawContent: string // Base64 data URL for files, URL string for links, or raw text for code
  notes?: string
  submittedAt: number
}

const STORAGE_PREFIX = 'studentpay_deliverable_'

/**
 * Compute keccak256 commitment hash from raw deliverable string or array buffer bytes.
 */
export function generateDeliverableHash(rawContent: string): `0x${string}` {
  return keccak256(toBytes(rawContent))
}

/**
 * Save a deliverable package to client-side storage.
 */
export async function saveDeliverable(pkg: DeliverablePackage): Promise<void> {
  try {
    const key = `${STORAGE_PREFIX}${pkg.dealId}`
    localStorage.setItem(key, JSON.stringify(pkg))

    // Also index by commitmentHash for resilience
    if (pkg.commitmentHash) {
      localStorage.setItem(`${STORAGE_PREFIX}hash_${pkg.commitmentHash.toLowerCase()}`, JSON.stringify(pkg))
    }
  } catch (err) {
    console.error('Failed to save deliverable locally:', err)
  }
}

/**
 * Get a deliverable package by dealId or commitmentHash.
 */
export async function getDeliverable(dealId: string, commitmentHash?: string): Promise<DeliverablePackage | null> {
  try {
    const keyByDeal = `${STORAGE_PREFIX}${dealId}`
    const stored = localStorage.getItem(keyByDeal)
    if (stored) {
      return JSON.parse(stored) as DeliverablePackage
    }

    if (commitmentHash) {
      const keyByHash = `${STORAGE_PREFIX}hash_${commitmentHash.toLowerCase()}`
      const storedHash = localStorage.getItem(keyByHash)
      if (storedHash) {
        return JSON.parse(storedHash) as DeliverablePackage
      }
    }
  } catch (err) {
    console.error('Failed to retrieve deliverable:', err)
  }
  return null
}
