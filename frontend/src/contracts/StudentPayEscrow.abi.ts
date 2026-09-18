// ─────────────────────────────────────────────────────────────────────────────
// StudentPayEscrow ABI
// ─────────────────────────────────────────────────────────────────────────────
// Copy the compiled ABI from out/StudentPayEscrow.sol/StudentPayEscrow.json
// after running: forge build
// ─────────────────────────────────────────────────────────────────────────────

export const ESCROW_ABI = [
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'DealCreated',
    inputs: [
      { name: 'dealId',   type: 'uint256', indexed: true  },
      { name: 'buyer',    type: 'address', indexed: true  },
      { name: 'seller',   type: 'address', indexed: true  },
      { name: 'amount',   type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DealFunded',
    inputs: [
      { name: 'dealId', type: 'uint256', indexed: true  },
      { name: 'buyer',  type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WorkSubmitted',
    inputs: [
      { name: 'dealId',     type: 'uint256', indexed: true  },
      { name: 'seller',     type: 'address', indexed: true  },
      { name: 'submission', type: 'string',  indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WorkCompleted',
    inputs: [
      { name: 'dealId',  type: 'uint256', indexed: true },
      { name: 'seller',  type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'FundsReleased',
    inputs: [
      { name: 'dealId',  type: 'uint256', indexed: true  },
      { name: 'seller',  type: 'address', indexed: true  },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RefundClaimed',
    inputs: [
      { name: 'dealId', type: 'uint256', indexed: true  },
      { name: 'buyer',  type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DealCancelled',
    inputs: [
      { name: 'dealId',      type: 'uint256', indexed: true },
      { name: 'cancelledBy', type: 'address', indexed: true },
    ],
  },

  // ── Read Functions ──────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'dealCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getDeal',
    stateMutability: 'view',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id',          type: 'uint256' },
          { name: 'buyer',       type: 'address' },
          { name: 'seller',      type: 'address' },
          { name: 'amount',      type: 'uint256' },
          { name: 'deadline',    type: 'uint256' },
          { name: 'status',      type: 'uint8'   },
          { name: 'description', type: 'string'  },
          { name: 'workSubmission', type: 'string' },
          { name: 'createdAt',   type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getDealsForAddress',
    stateMutability: 'view',
    inputs: [{ name: 'participant', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },

  // ── Write Functions ─────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createDeal',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'seller',      type: 'address' },
      { name: 'amount',      type: 'uint256' },
      { name: 'deadline',    type: 'uint256' },
      { name: 'description', type: 'string'  },
    ],
    outputs: [{ name: 'dealId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'fundDeal',
    stateMutability: 'payable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitWork',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dealId',     type: 'uint256' },
      { name: 'submission', type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'markWorkCompleted',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'releaseFunds',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimRefund',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'cancelDeal',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
] as const

