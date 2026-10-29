// ─────────────────────────────────────────────────────────────────────────────
// useWallet — thin wrapper over wagmi's useAccount / useBalance
// ─────────────────────────────────────────────────────────────────────────────
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { botchain } from '@/config/chains'

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  const isOnBotChain = chainId === botchain.id

  const switchToBotChain = () => {
    if (!isOnBotChain) switchChain({ chainId: botchain.id })
  }

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    isOnBotChain,
    switchToBotChain,
    // Backwards-compatibility aliases
    isOnBohr: isOnBotChain,
    switchToBohr: switchToBotChain,
    balance,
  }
}

