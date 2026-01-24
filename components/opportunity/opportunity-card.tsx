"use client"

import { ExternalLink, Shield, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Typography } from "@/components/global/typography"

type Opportunity = {
  id: string
  name: string
  chain: "ethereum" | "stacks"
  apy: number
  totalApy: number
  bridgeBonus: number
  riskScore: number
  tvl: number
}

type OpportunityCardProps = {
  opportunity: Opportunity
  ethBenchmark?: number
}

const RISK_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-emerald-400",
  3: "bg-lime-400",
  4: "bg-yellow-400",
  5: "bg-amber-400",
  6: "bg-orange-400",
  7: "bg-orange-500",
  8: "bg-red-400",
  9: "bg-red-500",
  10: "bg-red-600",
}

const CHAIN_CONFIG = {
  ethereum: {
    label: "ETH",
    bgColor: "bg-[#627EEA]/10",
    textColor: "text-[#627EEA]",
    borderColor: "border-[#627EEA]/30",
  },
  stacks: {
    label: "STX",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/30",
  },
}

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(0)}M`
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`
  return `$${tvl.toFixed(0)}`
}

export function OpportunityCard({
  opportunity,
  ethBenchmark = 3.5,
}: OpportunityCardProps) {
  const { name, chain, apy, totalApy, bridgeBonus, riskScore, tvl } =
    opportunity
  const chainConfig = CHAIN_CONFIG[chain]

  // Calculate yield spread (only meaningful for Stacks protocols)
  const yieldSpread = chain === "stacks" ? totalApy - ethBenchmark : 0
  const isHighYield = yieldSpread > 2

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:ring-1 hover:ring-primary/50",
        isHighYield &&
          "shadow-[0_0_20px_-5px] ring-1 shadow-primary/20 ring-primary/30"
      )}
    >
      {/* High Yield Indicator */}
      {isHighYield && (
        <div className="absolute top-0 right-0 overflow-hidden">
          <div
            className="absolute top-2 -right-6 rotate-45 bg-primary px-6 py-0.5"
          >
            <Typography
              variant="caption"
              weight="bold"
              className="text-[8px] tracking-widest text-primary-foreground
                uppercase"
            >
              Hot
            </Typography>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* Header */}
        <div
          className="flex items-start justify-between border-b border-border
            p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  `h-5 border px-1.5 text-[10px] font-bold tracking-wider
                  uppercase`,
                  chainConfig.bgColor,
                  chainConfig.textColor,
                  chainConfig.borderColor
                )}
              >
                {chainConfig.label}
              </Badge>
              <Typography
                variant="p2"
                weight="semibold"
                family="head"
                className="line-clamp-1"
              >
                {name}
              </Typography>
            </div>
            <div className="flex items-center gap-3">
              <Typography variant="caption" textColor="muted-foreground">
                TVL {formatTVL(tvl)}
              </Typography>
            </div>
          </div>
        </div>

        {/* APY Display */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-4">
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="mb-1 block tracking-wider uppercase"
            >
              {chain === "stacks" ? "Total APY" : "Base APY"}
            </Typography>
            <div className="flex items-baseline gap-1">
              <Typography
                variant="h4"
                family="body"
                weight="bold"
                className={cn(
                  "tabular-nums",
                  chain === "stacks" && "text-primary"
                )}
              >
                {totalApy.toFixed(2)}
              </Typography>
              <Typography
                variant="p2"
                textColor="muted-foreground"
                weight="medium"
              >
                %
              </Typography>
            </div>
            {bridgeBonus > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <Zap className="size-3 text-primary" />
                <Typography variant="caption" className="text-primary">
                  +{bridgeBonus.toFixed(2)}% BXR
                </Typography>
              </div>
            )}
          </div>

          {/* Risk Score */}
          <div className="p-4">
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="mb-1 block tracking-wider uppercase"
            >
              Risk Score
            </Typography>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-4 w-1.5 rounded-sm transition-colors",
                      i < Math.ceil(riskScore / 2)
                        ? RISK_COLORS[riskScore] || "bg-muted"
                        : "bg-muted/30"
                    )}
                  />
                ))}
              </div>
              <Typography
                variant="p2"
                weight="bold"
                family="body"
                className="tabular-nums"
              >
                {riskScore}/10
              </Typography>
            </div>
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="mt-1"
            >
              {riskScore <= 2
                ? "Very Low"
                : riskScore <= 4
                  ? "Low"
                  : riskScore <= 6
                    ? "Medium"
                    : riskScore <= 8
                      ? "High"
                      : "Very High"}
            </Typography>
          </div>
        </div>

        {/* Yield Spread (Stacks only) */}
        {chain === "stacks" && (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={cn(
                    "size-4",
                    isHighYield ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <Typography
                  variant="caption"
                  textColor="muted-foreground"
                  className="tracking-wider uppercase"
                >
                  vs ETH Benchmark
                </Typography>
              </div>
              <div className="flex items-center gap-1">
                <Typography
                  variant="p2"
                  weight="bold"
                  family="body"
                  className={cn(
                    "tabular-nums",
                    yieldSpread > 0 ? "text-emerald-500" : "text-destructive"
                  )}
                >
                  {yieldSpread > 0 ? "+" : ""}
                  {yieldSpread.toFixed(2)}%
                </Typography>
              </div>
            </div>
            {/* Spread Bar */}
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full
                bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isHighYield ? "bg-primary" : "bg-emerald-500"
                )}
                style={{
                  width: `${Math.min(Math.max((yieldSpread / 10) * 100, 5), 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
