// ─────────────────────────────────────────────────────────────────────────────
// StudentPayEscrow ABI (V2: Blinded Proofs, Grace Period, Disputes & Auto-Release)
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
    name: 'ProofSubmitted',
    inputs: [
      { name: 'dealId',         type: 'uint256', indexed: true  },
      { name: 'seller',         type: 'address', indexed: true  },
      { name: 'commitmentHash', type: 'bytes32', indexed: false },
      { name: 'submittedAt',    type: 'uint256', indexed: false },
      { name: 'graceEndsAt',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ProofRevealed',
    inputs: [
      { name: 'dealId',        type: 'uint256', indexed: true  },
      { name: 'proofPreimage', type: 'string',  indexed: false },
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
    name: 'AutoReleased',
    inputs: [
      { name: 'dealId',  type: 'uint256', indexed: true  },
      { name: 'seller',  type: 'address', indexed: true  },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DisputeOpened',
    inputs: [
      { name: 'dealId', type: 'uint256', indexed: true  },
      { name: 'buyer',  type: 'address', indexed: true  },
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
    name: 'GRACE_PERIOD',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isGracePeriodActive',
    stateMutability: 'view',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
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
          { name: 'id',             type: 'uint256' },
          { name: 'buyer',          type: 'address' },
          { name: 'seller',         type: 'address' },
          { name: 'amount',         type: 'uint256' },
          { name: 'deadline',       type: 'uint256' },
          { name: 'status',         type: 'uint8'   },
          { name: 'description',    type: 'string'  },
          { name: 'createdAt',      type: 'uint256' },
          { name: 'commitmentHash', type: 'bytes32' },
          { name: 'proofPreimage',  type: 'string'  },
          { name: 'submittedAt',    type: 'uint256' },
          { name: 'graceEndsAt',    type: 'uint256' },
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
    name: 'submitProof',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dealId',         type: 'uint256' },
      { name: 'commitmentHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'revealProof',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dealId',   type: 'uint256' },
      { name: 'rawProof', type: 'string'  },
    ],
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
    name: 'releaseFundsWithProof',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dealId',   type: 'uint256' },
      { name: 'rawProof', type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'openDispute',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dealId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimAutoRelease',
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
