"use client"

import { WalletProvider } from "@/lib/providers/wallet-provider"
import { BridgeForm } from "@/components/bridge/bridge-form"

export function BridgeWidget({ className }: { className?: string }) {
  return (
    <WalletProvider>
      <BridgeForm className={className} />
    </WalletProvider>
  )
}
