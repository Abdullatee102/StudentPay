// ─────────────────────────────────────────────────────────────────────────────
// Shared utility functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shorten an Ethereum address: 0x1234…abcd
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

/**
 * Convert a Unix timestamp (seconds) to a human-readable relative string.
 * E.g. "in 2 days", "3 hours ago"
 */
export function timeFromNow(unixSeconds: bigint | number): string {
  const ms   = Number(unixSeconds) * 1000
  const diff = ms - Date.now()
  const abs  = Math.abs(diff)

  const minutes = Math.floor(abs / 60_000)
  const hours   = Math.floor(abs / 3_600_000)
  const days    = Math.floor(abs / 86_400_000)

  let unit: string
  if (days > 0)    unit = `${days} day${days !== 1 ? 's' : ''}`
  else if (hours > 0) unit = `${hours} hour${hours !== 1 ? 's' : ''}`
  else              unit = `${minutes} minute${minutes !== 1 ? 's' : ''}`

  return diff > 0 ? `in ${unit}` : `${unit} ago`
}

/**
 * Format a bigint wei value as a human-readable ETH/BOT amount string.
 * E.g. formatWei(1000000000000000000n) → "1.0000"
 */
export function formatWei(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(decimals)
}

/**
 * Check if a string is a valid Ethereum address.
 */
export function isValidAddress(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(value)
}

