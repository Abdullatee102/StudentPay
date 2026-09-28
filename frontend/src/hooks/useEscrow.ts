// ─────────────────────────────────────────────────────────────────────────────
// useEscrow — central hook for interacting with StudentPayEscrow V2
// ─────────────────────────────────────────────────────────────────────────────
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, keccak256, toBytes } from 'viem'
import { ESCROW_ABI } from '@/contracts/StudentPayEscrow.abi'
import { CONTRACT_ADDRESSES } from '@/config/chains'
import type { Deal, CreateDealInput } from '@/contracts/types'
import { DealStatus } from '@/contracts/types'
import { useQueryClient } from '@tanstack/react-query'

const escrowAddress = CONTRACT_ADDRESSES.escrow

// ── Read: fetch a single deal ─────────────────────────────────────────────────
export function useGetDeal(dealId: bigint | undefined) {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'getDeal',
    args:         dealId !== undefined ? [dealId] : undefined,
    query: {
      enabled: dealId !== undefined && Boolean(escrowAddress),
    },
  })
}

// ── Read: check if 48h grace period is active ─────────────────────────────────
export function useIsGracePeriodActive(dealId: bigint | undefined) {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'isGracePeriodActive',
    args:         dealId !== undefined ? [dealId] : undefined,
    query: {
      enabled: dealId !== undefined && Boolean(escrowAddress),
    },
  })
}

// ── Read: fetch deal IDs for a participant ────────────────────────────────────
export function useGetDealsForAddress(address: `0x${string}` | undefined) {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'getDealsForAddress',
    args:         address ? [address] : undefined,
    query: {
      enabled: !!address && Boolean(escrowAddress),
    },
  })
}

// ── Read: total deal count ────────────────────────────────────────────────────
export function useDealCount() {
  return useReadContract({
    abi:          ESCROW_ABI,
    address:      escrowAddress,
    functionName: 'dealCount',
    query: { enabled: Boolean(escrowAddress) },
  })
}

// ── Write: create deal ────────────────────────────────────────────────────────
export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const createDeal = (input: CreateDealInput) => {
    const deadlineTimestamp = BigInt(
      Math.floor(new Date(input.deadlineDate).getTime() / 1000)
    );
    writeContract({
      abi: ESCROW_ABI,
      address: escrowAddress,
      functionName: 'createDeal',
      args: [
        input.sellerAddress as `0x${string}`,
        parseEther(input.amountEth),
        deadlineTimestamp,
        input.description,
      ],
    });
    // Invalidate all cached queries so UI updates after transaction
    queryClient.invalidateQueries();
  };

  return { createDeal, hash, isPending, error, receipt };
}

// ── Write: fund deal ──────────────────────────────────────────────────────────
export function useFundDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const fundDeal = (dealId: bigint, amountWei: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'fundDeal',
      args:         [dealId],
      value:        amountWei,
    })
  }

  return { fundDeal, hash, isPending, error, receipt }
}

// ── Write: submit blinded proof commitment (Seller) ───────────────────────────
export function useSubmitProof() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const submitProof = (dealId: bigint, commitmentHash: `0x${string}`) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'submitProof',
      args:         [dealId, commitmentHash],
    })
  }

  return { submitProof, hash, isPending, error, receipt }
}

// ── Write: reveal raw proof preimage (Seller or Buyer) ────────────────────────
export function useRevealProof() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const revealProof = (dealId: bigint, rawProof: string) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'revealProof',
      args:         [dealId, rawProof],
    })
  }

  return { revealProof, hash, isPending, error, receipt }
}

// ── Write: release funds (Buyer) ──────────────────────────────────────────────
export function useReleaseFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const releaseFunds = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'releaseFunds',
      args:         [dealId],
    })
  }

  return { releaseFunds, hash, isPending, error, receipt }
}

// ── Write: release funds with raw proof recorded on-chain (Buyer) ─────────────
export function useReleaseFundsWithProof() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const releaseFundsWithProof = (dealId: bigint, rawProof: string) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'releaseFundsWithProof',
      args:         [dealId, rawProof],
    })
  }

  return { releaseFundsWithProof, hash, isPending, error, receipt }
}

// ── Write: open dispute during 48h grace period (Buyer) ───────────────────────
export function useOpenDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const openDispute = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'openDispute',
      args:         [dealId],
    })
  }

  return { openDispute, hash, isPending, error, receipt }
}

// ── Write: claim auto-release after 48h grace expires (Seller) ─────────────────
export function useClaimAutoRelease() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const claimAutoRelease = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'claimAutoRelease',
      args:         [dealId],
    })
  }

  return { claimAutoRelease, hash, isPending, error, receipt }
}

// ── Write: claim refund (Buyer: deadline passed without proof OR disputed) ────
export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const claimRefund = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'claimRefund',
      args:         [dealId],
    })
  }

  return { claimRefund, hash, isPending, error, receipt }
}

// ── Write: cancel unfunded deal (Buyer) ───────────────────────────────────────
export function useCancelDeal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  const cancelDeal = (dealId: bigint) => {
    writeContract({
      abi:          ESCROW_ABI,
      address:      escrowAddress,
      functionName: 'cancelDeal',
      args:         [dealId],
    })
  }

  return { cancelDeal, hash, isPending, error, receipt }
}

// ── Cryptographic Utility: compute keccak256 commitment hash ──────────────────
export function computeCommitmentHash(rawProofString: string): `0x${string}` {
  return keccak256(toBytes(rawProofString))
}

// ── Utility: map raw tuple from getDeal into typed Deal ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseDeal(raw: any): Deal {
  return {
    id:             raw.id,
    buyer:          raw.buyer,
    seller:         raw.seller,
    amount:         raw.amount,
    deadline:       raw.deadline,
    status:         raw.status as DealStatus,
    description:    raw.description,
    createdAt:      raw.createdAt,
    commitmentHash: raw.commitmentHash,
    proofPreimage:  raw.proofPreimage,
    submittedAt:    raw.submittedAt,
    graceEndsAt:    raw.graceEndsAt,
  }
}
