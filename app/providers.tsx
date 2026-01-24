"use client"

import type { ReactNode } from "react"
import { WalletProvider } from "@/lib/providers/wallet-provider"

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
