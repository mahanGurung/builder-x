"use client"

import { AppConfig, showConnect, UserSession } from "@stacks/connect"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createConfig, http, WagmiProvider } from "wagmi"
import { sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { createContext, useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"

// ============ Wagmi Config (Ethereum) ============
const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

// ============ Stacks Config ============
const appConfig = new AppConfig(["store_write", "publish_data"])
const userSession = new UserSession({ appConfig })

// ============ Wallet Context Types ============
type StacksWalletState = {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
}

type WalletContextValue = {
  // Stacks wallet
  stacks: StacksWalletState
  connectStacks: () => void
  disconnectStacks: () => void
  // User session for Stacks transactions
  stacksUserSession: UserSession
}

export const WalletContext = createContext<WalletContextValue | null>(null)

// ============ Stacks Wallet Provider ============
function StacksWalletProvider({ children }: { children: ReactNode }) {
  const [stacksState, setStacksState] = useState<StacksWalletState>(() => {
    if (!userSession.isUserSignedIn()) {
      return { address: null, isConnected: false, isConnecting: false }
    }

    const userData = userSession.loadUserData()
    const address = userData.profile?.stxAddress?.testnet || null
    return { address, isConnected: true, isConnecting: false }
  })

  const connectStacks = useCallback(() => {
    setStacksState((prev) => ({ ...prev, isConnecting: true }))

    showConnect({
      appDetails: {
        name: "Builder-X",
        icon: "/logo.svg",
      },
      redirectTo: "/",
      onFinish: () => {
        const userData = userSession.loadUserData()
        const address = userData.profile?.stxAddress?.testnet || null
        setStacksState({
          address,
          isConnected: true,
          isConnecting: false,
        })
      },
      onCancel: () => {
        setStacksState((prev) => ({ ...prev, isConnecting: false }))
      },
      userSession,
    })
  }, [])

  const disconnectStacks = useCallback(() => {
    userSession.signUserOut()
    setStacksState({
      address: null,
      isConnected: false,
      isConnecting: false,
    })
  }, [])

  const value = useMemo<WalletContextValue>(
    () => ({
      stacks: stacksState,
      connectStacks,
      disconnectStacks,
      stacksUserSession: userSession,
    }),
    [stacksState, connectStacks, disconnectStacks]
  )

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

// ============ Combined Wallet Provider ============
export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <StacksWalletProvider>{children}</StacksWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
