"use client"

import type { ReactNode } from "react"
import { WalletProvider } from "@/lib/providers/wallet-provider"
import { Navbar } from "@/components/global/navbar"

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <Navbar />
      {children}
    </WalletProvider>
  )
}

export default ClientShell
