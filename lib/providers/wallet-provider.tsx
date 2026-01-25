"use client"

import {
  connect,
  disconnect,
  getLocalStorage,
  isConnected,
} from "@stacks/connect"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createConfig, http, WagmiProvider } from "wagmi"
import { sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { create } from "zustand"
import type { ReactNode } from "react"
import { useState } from "react"

const queryClient = new QueryClient()

// ============ Stacks Wallet Store (Zustand) ============
type StacksWalletStore = {
  stxAddress: string
  isConnected: boolean
  isConnecting: boolean
  actions: {
    connectWallet: () => Promise<void>
    disconnectWallet: () => void
  }
}

const useStacksWalletStore = create<StacksWalletStore>((set) => ({
  stxAddress:
    typeof window !== "undefined"
      ? getLocalStorage()?.addresses?.stx?.at(0)?.address || ""
      : "",
  isConnected: typeof window !== "undefined" ? isConnected() : false,
  isConnecting: false,
  actions: {
    connectWallet: async () => {
      set({ isConnecting: true })
      try {
        await connect()
        const storageData = getLocalStorage()
        const address = storageData?.addresses?.stx?.at(0)?.address || ""
        set({
          stxAddress: address,
          isConnected: isConnected(),
          isConnecting: false,
        })
      } catch {
        set({ isConnecting: false })
      }
    },
    disconnectWallet: () => {
      disconnect()
      set({
        stxAddress: "",
        isConnected: false,
        isConnecting: false,
      })
    },
  },
}))

// ============ Stacks Wallet Hooks ============
export const useStacksWalletActions = () =>
  useStacksWalletStore((state) => state.actions)
export const useStxAddress = () =>
  useStacksWalletStore((state) => state.stxAddress)
export const useIsStacksConnected = () =>
  useStacksWalletStore((state) => state.isConnected)
export const useIsStacksConnecting = () =>
  useStacksWalletStore((state) => state.isConnecting)

// ============ Combined Wallet Provider ============
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wagmiConfig] = useState(() =>
    createConfig({
      chains: [sepolia],
      connectors: [injected()],
      transports: {
        [sepolia.id]: http(),
      },
      ssr: true,
    })
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
