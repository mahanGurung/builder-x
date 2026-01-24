"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useContext } from "react"
import { WalletContext } from "@/lib/providers/wallet-provider"

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

  // Stacks wallet via context
  const walletContext = useContext(WalletContext)

  if (!walletContext) {
    throw new Error("useDualWallet must be used within WalletProvider")
  }

  const { stacks, connectStacks, disconnectStacks } = walletContext

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
    stacksAddress: stacks.address,
    isStacksConnected: stacks.isConnected,
    isStacksConnecting: stacks.isConnecting,
    connectStacks,
    disconnectStacks,

    // Combined
    areBothConnected: isEthConnected && stacks.isConnected,
    isAnyConnecting: isEthConnecting || stacks.isConnecting,
  }
}
