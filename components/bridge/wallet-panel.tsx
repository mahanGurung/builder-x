"use client"

import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/global/typography"

type WalletPanelProps = {
  // Ethereum
  ethAddress?: string
  isEthConnected: boolean
  isEthConnecting: boolean
  onConnectEth: () => void
  onDisconnectEth: () => void

  // Stacks
  stacksAddress: string | null
  isStacksConnected: boolean
  isStacksConnecting: boolean
  onConnectStacks: () => void
  onDisconnectStacks: () => void

  className?: string
}

function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

function WalletCard({
  chain,
  address,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  icon,
  explorerUrl,
}: {
  chain: string
  address?: string | null
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  icon: React.ReactNode
  explorerUrl?: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between border p-3 transition-all",
        isConnected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card/30 hover:border-border/80"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center",
            isConnected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Typography variant="p2" family="head" weight="medium">
              {chain}
            </Typography>
            {isConnected && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>
          {isConnected && address ? (
            <div className="flex items-center gap-1">
              <Typography
                variant="caption"
                className="font-mono text-muted-foreground"
              >
                {truncateAddress(address)}
              </Typography>
              {explorerUrl && (
                <a
                  href={`${explorerUrl}${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors
                    hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <Typography variant="caption" textColor="muted-foreground">
              Not connected
            </Typography>
          )}
        </div>
      </div>

      {isConnected ? (
        <Button
          variant="ghost"
          size="xs"
          onClick={onDisconnect}
          className="text-muted-foreground hover:text-destructive"
        >
          Disconnect
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          disabled={isConnecting}
          className="gap-1.5"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Connecting
            </>
          ) : (
            <>
              Connect
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function WalletPanel({
  ethAddress,
  isEthConnected,
  isEthConnecting,
  onConnectEth,
  onDisconnectEth,
  stacksAddress,
  isStacksConnected,
  isStacksConnecting,
  onConnectStacks,
  onDisconnectStacks,
  className,
}: WalletPanelProps) {
  const bothConnected = isEthConnected && isStacksConnected

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <Typography variant="p2" family="head" weight="semibold">
            Connect Wallets
          </Typography>
        </div>
        {bothConnected && (
          <div
            className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5
              text-green-500"
          >
            <CheckCircle2 className="h-3 w-3" />
            <Typography variant="caption" weight="medium">
              Ready
            </Typography>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2 flex-1 transition-colors",
            isEthConnected ? "bg-primary" : "bg-border"
          )}
        />
        <div className="flex h-5 w-5 items-center justify-center text-xs">
          -&gt;
        </div>
        <div
          className={cn(
            "h-2 flex-1 transition-colors",
            isStacksConnected ? "bg-primary" : "bg-border"
          )}
        />
      </div>

      {/* Wallet Cards */}
      <div className="space-y-2">
        <WalletCard
          chain="Ethereum (Sepolia)"
          address={ethAddress}
          isConnected={isEthConnected}
          isConnecting={isEthConnecting}
          onConnect={onConnectEth}
          onDisconnect={onDisconnectEth}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 256 417" fill="currentColor">
              <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
              <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
              <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
              <path d="M127.962 416.905v-104.72L0 236.585z" />
            </svg>
          }
          explorerUrl="https://sepolia.etherscan.io/address/"
        />

        <WalletCard
          chain="Stacks (Testnet)"
          address={stacksAddress}
          isConnected={isStacksConnected}
          isConnecting={isStacksConnecting}
          onConnect={onConnectStacks}
          onDisconnect={onDisconnectStacks}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          }
          explorerUrl="https://explorer.stacks.co/address/"
        />
      </div>

      {/* Helper Text */}
      {!bothConnected && (
        <Typography
          variant="caption"
          textColor="muted-foreground"
          className="block text-center"
        >
          Connect both wallets to bridge USDC from Ethereum to Stacks
        </Typography>
      )}
    </div>
  )
}
