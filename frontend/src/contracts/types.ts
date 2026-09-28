// ─────────────────────────────────────────────────────────────────────────────
// Deal types — mirrors the Solidity structs / enums (V2)
// ─────────────────────────────────────────────────────────────────────────────

export enum DealStatus {
  PENDING_FUNDING = 0,
  FUNDED          = 1,
  WORK_SUBMITTED  = 2,
  RELEASED        = 3,
  REFUNDED        = 4,
  CANCELLED       = 5,
  DISPUTED        = 6,
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  [DealStatus.PENDING_FUNDING]: 'Pending Funding',
  [DealStatus.FUNDED]:          'Funded / In Progress',
  [DealStatus.WORK_SUBMITTED]:  'Proof Escrowed (Review Window)',
  [DealStatus.RELEASED]:        'Funds Released',
  [DealStatus.REFUNDED]:        'Refunded',
  [DealStatus.CANCELLED]:       'Cancelled',
  [DealStatus.DISPUTED]:        'Disputed',
}

export const DEAL_STATUS_COLOURS: Record<DealStatus, string> = {
  [DealStatus.PENDING_FUNDING]: '#f59e0b', // amber
  [DealStatus.FUNDED]:          '#3b82f6', // blue
  [DealStatus.WORK_SUBMITTED]:  '#8b5cf6', // violet
  [DealStatus.RELEASED]:        '#22c55e', // green
  [DealStatus.REFUNDED]:        '#64748b', // slate
  [DealStatus.CANCELLED]:       '#ef4444', // red
  [DealStatus.DISPUTED]:        '#ec4899', // pink/rose
}

// ── On-chain Deal shape returned by getDeal ──────────────────────────────────
export interface Deal {
  id:             bigint
  buyer:          `0x${string}`
  seller:         `0x${string}`
  amount:         bigint
  deadline:       bigint
  status:         DealStatus
  description:    string
  createdAt:      bigint
  commitmentHash: `0x${string}`
  proofPreimage:  string
  submittedAt:    bigint
  graceEndsAt:    bigint
}

// ── Form input for creating a deal ────────────────────────────────────────────
export interface CreateDealInput {
  sellerAddress: string
  amountEth:     string
  deadlineDate:  string // ISO date string from date input
  description:   string
}
