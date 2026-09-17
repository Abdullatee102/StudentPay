// ─────────────────────────────────────────────────────────────────────────────
// useWallet — thin wrapper over wagmi's useAccount / useBalance
// ─────────────────────────────────────────────────────────────────────────────
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { bohrTestnet } from '@/config/chains'

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  const isOnBohr = chainId === bohrTestnet.id

  const switchToBohr = () => {
    if (!isOnBohr) switchChain({ chainId: bohrTestnet.id })
  }

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    isOnBohr,
    switchToBohr,
    balance,
  }
}

