"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import {
  useIsStacksConnected,
  useIsStacksConnecting,
  useStacksWalletActions,
  useStxAddress,
} from "@/lib/providers/wallet-provider"

export type DualWalletState = {
  // Ethereum
  ethAddress: string | undefined
  isEthConnected: boolean
  isEthConnecting: boolean
  connectEth: () => void
  disconnectEth: () => void

  // Stacks
  stacksAddress: string | null
  isStacksConnected: boolean
  isStacksConnecting: boolean
  connectStacks: () => void
  disconnectStacks: () => void

  // Combined states
  areBothConnected: boolean
  isAnyConnecting: boolean
}

export function useDualWallet(): DualWalletState {
  // Ethereum wallet via wagmi
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { connect, connectors, isPending: isEthConnecting } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  // Stacks wallet via Zustand store
  const stxAddress = useStxAddress()
  const isStacksConnected = useIsStacksConnected()
  const isStacksConnecting = useIsStacksConnecting()
  const { connectWallet, disconnectWallet } = useStacksWalletActions()

  const connectEth = () => {
    const injectedConnector = connectors.find((c) => c.id === "injected")
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  const disconnectEth = () => {
    wagmiDisconnect()
  }

  return {
    // Ethereum
    ethAddress,
    isEthConnected,
    isEthConnecting,
    connectEth,
    disconnectEth,

    // Stacks
    stacksAddress: stxAddress || null,
    isStacksConnected,
    isStacksConnecting,
    connectStacks: connectWallet,
    disconnectStacks: disconnectWallet,

    // Combined
    areBothConnected: isEthConnected && isStacksConnected,
    isAnyConnecting: isEthConnecting || isStacksConnecting,
  }
}
