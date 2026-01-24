"use client"

import { Calculator, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type EarningsCalculatorProps = {
  opportunities: Opportunity[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

export function EarningsCalculator({ opportunities }: EarningsCalculatorProps) {
  const [amount, setAmount] = useState<string>("1000")
  const [selectedProtocol, setSelectedProtocol] = useState<string>("best")

  const selectedApy = useMemo(() => {
    if (selectedProtocol === "best") {
      const best = opportunities.reduce(
        (max, opp) => (opp.totalApy > max ? opp.totalApy : max),
        0
      )
      return best || 8.5 // Fallback
    }
    const found = opportunities.find((o) => o.id === selectedProtocol)
    return found?.totalApy || 0
  }, [opportunities, selectedProtocol])

  const parsedAmount = parseFloat(amount) || 0

  const projections = useMemo(() => {
    const dailyRate = selectedApy / 100 / 365
    const monthlyRate = selectedApy / 100 / 12
    const yearlyRate = selectedApy / 100

    return {
      daily: parsedAmount * dailyRate,
      monthly: parsedAmount * monthlyRate,
      yearly: parsedAmount * yearlyRate,
    }
  }, [parsedAmount, selectedApy])

  return (
    <div className="rounded-none border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Calculator className="size-4 text-primary" />
        <Typography
          variant="p2"
          weight="bold"
          family="head"
          className="tracking-wider uppercase"
        >
          Earnings Projection
        </Typography>
      </div>

      {/* Inputs */}
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label
            htmlFor="deposit-amount"
            className="text-xs tracking-wider text-muted-foreground uppercase"
          >
            Deposit Amount (USDC)
          </Label>
          <div className="relative">
            <DollarSign
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2
                text-muted-foreground"
            />
            <Input
              id="deposit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 font-body text-lg font-bold tabular-nums"
              placeholder="1000"
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            className="text-xs tracking-wider text-muted-foreground uppercase"
          >
            Target Protocol
          </Label>
          <Select
            value={selectedProtocol}
            onValueChange={(val) => val && setSelectedProtocol(val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">
                <span className="flex items-center gap-2">
                  <TrendingUp className="size-3 text-primary" />
                  Best Available
                </span>
              </SelectItem>
              {opportunities.map((opp) => (
                <SelectItem key={opp.id} value={opp.id}>
                  <span className="flex items-center justify-between gap-4">
                    <span>{opp.name}</span>
                    <span className="text-xs text-primary">
                      {opp.totalApy.toFixed(2)}%
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* APY Display */}
        <div className="rounded-none border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="tracking-wider uppercase"
            >
              Effective APY
            </Typography>
            <Typography
              variant="h5"
              family="body"
              weight="bold"
              className="text-primary tabular-nums"
            >
              {selectedApy.toFixed(2)}%
            </Typography>
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="border-t border-border">
        <div className="grid grid-cols-3 divide-x divide-border">
          <ProjectionCell
            label="Daily"
            value={projections.daily}
            icon={<Calendar className="size-3" />}
          />
          <ProjectionCell
            label="Monthly"
            value={projections.monthly}
            icon={<Calendar className="size-3" />}
            highlight
          />
          <ProjectionCell
            label="Yearly"
            value={projections.yearly}
            icon={<Calendar className="size-3" />}
          />
        </div>
      </div>

      {/* Footer Note */}
      <div className="border-t border-border bg-muted/30 px-4 py-3">
        <Typography
          variant="caption"
          textColor="muted-foreground"
          className="block text-center"
        >
          Projections based on current rates. APY may fluctuate.
        </Typography>
      </div>
    </div>
  )
}

function ProjectionCell({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={cn("p-3 text-center", highlight && "bg-primary/5")}>
      <div
        className="mb-1 flex items-center justify-center gap-1
          text-muted-foreground"
      >
        {icon}
        <Typography
          variant="caption"
          textColor="muted-foreground"
          className="tracking-wider uppercase"
        >
          {label}
        </Typography>
      </div>
      <Typography
        variant="p1"
        family="body"
        weight="bold"
        className={cn("tabular-nums", highlight && "text-primary")}
      >
        {formatCurrency(value)}
      </Typography>
    </div>
  )
}
