// ─────────────────────────────────────────────────────────────────────────────
// useEscrow — central hook for interacting with the StudentPayEscrow contract
// ─────────────────────────────────────────────────────────────────────────────
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { ESCROW_ABI } from '@/contracts/StudentPayEscrow.abi'
import { CONTRACT_ADDRESSES } from '@/config/chains'
import type { Deal, CreateDealInput } from '@/contracts/types'
import { DealStatus } from '@/contracts/types'

// Guard: warn if no contract address configured
const escrowAddress = CONTRACT_ADDRESSES.escrow

function requireEscrowAddress(): Address {
  if (!escrowAddress) {
    throw new Error('StudentPayEscrow is not deployed or configured')
  }
  return escrowAddress
}

// ── Read: fetch a single deal ─────────────────────────────────────────────────
export function useGetDeal(dealId: bigint | undefined) {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'getDeal',
    args:         dealId !== undefined ? [dealId] : undefined,
    query: {
      enabled: dealId !== undefined && !!escrowAddress,
    },
  })
}

// ── Read: fetch deal IDs for a participant ─────────────────────────────────────
export function useGetDealsForAddress(address: `0x${string}` | undefined) {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'getDealsForAddress',
    args:         address ? [address] : undefined,
    query: {
      enabled: !!address && !!escrowAddress,
    },
  })
}

// ── Read: total deal count ────────────────────────────────────────────────────
export function useDealCount() {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'dealCount',
    query: { enabled: !!escrowAddress },
  })
}

// ── Write: create deal ────────────────────────────────────────────────────────
export function useCreateDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  const createDeal = (input: CreateDealInput) => {
    const deadlineTimestamp = BigInt(
      Math.floor(new Date(input.deadlineDate).getTime() / 1000)
    )
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'createDeal',
      args: [
        input.sellerAddress as `0x${string}`,
        parseEther(input.amountEth),
        deadlineTimestamp,
        input.description,
      ],
    })
  }

  return { createDeal, hash, isPending, error, receipt }
}

// ── Write: fund deal ──────────────────────────────────────────────────────────
export function useFundDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const fundDeal = (dealId: bigint, amountWei: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'fundDeal',
      args:         [dealId],
      value:        amountWei,
    })
  }

  return { fundDeal, hash, isPending, error, receipt }
}

// ── Write: mark work completed ────────────────────────────────────────────────
export function useMarkWorkCompleted() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const markCompleted = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'markWorkCompleted',
      args:         [dealId],
    })
  }

  return { markCompleted, hash, isPending, error, receipt }
}

// ── Write: release funds ──────────────────────────────────────────────────────
export function useReleaseFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const releaseFunds = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'releaseFunds',
      args:         [dealId],
    })
  }

  return { releaseFunds, hash, isPending, error, receipt }
}

// ── Write: claim refund ───────────────────────────────────────────────────────
export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const claimRefund = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'claimRefund',
      args:         [dealId],
    })
  }

  return { claimRefund, hash, isPending, error, receipt }
}

// ── Write: cancel deal ────────────────────────────────────────────────────────
export function useCancelDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const cancelDeal = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      requireEscrowAddress(),
      functionName: 'cancelDeal',
      args:         [dealId],
    })
  }

  return { cancelDeal, hash, isPending, error, receipt }
}

// ── Utility: map raw tuple from getDeal into typed Deal ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseDeal(raw: any): Deal {
  return {
    id:          raw.id,
    buyer:       raw.buyer,
    seller:      raw.seller,
    amount:      raw.amount,
    deadline:    raw.deadline,
    status:      raw.status as DealStatus,
    description: raw.description,
    createdAt:   raw.createdAt,
  }
}

