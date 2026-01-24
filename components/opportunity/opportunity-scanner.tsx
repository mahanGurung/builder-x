"use client"

import { RefreshCcw, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Typography } from "@/components/global/typography"

import { EarningsCalculator } from "./earnings-calculator"
import { OpportunityCard } from "./opportunity-card"

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

const ETH_BENCHMARK = 3.5 // Fixed Ethereum USDC benchmark

export function OpportunityScanner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chainFilter, setChainFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("totalApy")
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOpportunities = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch("/api/opportunities")
      const result = await res.json()
      if (result.success) {
        setOpportunities(result.data)
        setLastUpdated(new Date(result.meta.lastUpdate))
        setError(null)
      } else {
        setError("Failed to fetch opportunities")
      }
    } catch {
      setError("Network error: Could not connect to API")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
    const interval = setInterval(() => fetchOpportunities(), 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredAndSorted = useMemo(() => {
    return opportunities
      .filter((opp) => chainFilter === "all" || opp.chain === chainFilter)
      .sort((a, b) => {
        if (sortBy === "totalApy") return b.totalApy - a.totalApy
        if (sortBy === "riskScore") return a.riskScore - b.riskScore
        if (sortBy === "tvl") return b.tvl - a.tvl
        return 0
      })
  }, [opportunities, chainFilter, sortBy])

  if (loading && opportunities.length === 0) {
    return (
      <div
        className="flex h-[400px] w-full flex-col items-center justify-center
          gap-4"
      >
        <RefreshCcw className="size-8 animate-spin text-primary" />
        <Typography variant="p1" textColor="muted-foreground">
          Scanning DeFi protocols for yield...
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div
        className="flex flex-col gap-6 lg:flex-row lg:items-end
          lg:justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Typography variant="h4" family="head" weight="bold">
              Opportunity Scanner
            </Typography>
            <div className="relative flex size-2.5">
              <span
                className={cn(
                  `absolute inline-flex h-full w-full animate-ping rounded-full
                  opacity-75`,
                  refreshing ? "bg-primary" : "bg-emerald-500"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2.5 rounded-full",
                  refreshing ? "bg-primary" : "bg-emerald-500"
                )}
              />
            </div>
          </div>
          <Typography
            variant="p2"
            textColor="muted-foreground"
            className="max-w-lg"
          >
            Real-time yield aggregation across Ethereum and Stacks. Bridge USDC
            via xReserve to access higher yields + earn $BXR rewards.
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chain Filter Toggle */}
          <div
            className="flex items-center gap-1 rounded-none border border-border
              bg-card p-1"
          >
            <Button
              variant={chainFilter === "all" ? "default" : "ghost"}
              size="xs"
              onClick={() => setChainFilter("all")}
              className="h-6 px-2 text-[10px] tracking-wider uppercase"
            >
              All
            </Button>
            <Button
              variant={chainFilter === "ethereum" ? "default" : "ghost"}
              size="xs"
              onClick={() => setChainFilter("ethereum")}
              className="h-6 px-2 text-[10px] tracking-wider uppercase"
            >
              Ethereum
            </Button>
            <Button
              variant={chainFilter === "stacks" ? "default" : "ghost"}
              size="xs"
              onClick={() => setChainFilter("stacks")}
              className="h-6 px-2 text-[10px] tracking-wider uppercase"
            >
              Stacks
            </Button>
          </div>

          {/* Sort Selector */}
          <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalApy">Highest APY</SelectItem>
              <SelectItem value="riskScore">Lowest Risk</SelectItem>
              <SelectItem value="tvl">Highest TVL</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => fetchOpportunities(true)}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCcw
              className={cn("size-3.5", refreshing && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main Grid */}
        <div className="space-y-6">
          {error && (
            <div
              className="rounded-none border border-destructive/50
                bg-destructive/10 p-4 text-destructive"
            >
              <Typography variant="p2">{error}</Typography>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredAndSorted.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                ethBenchmark={ETH_BENCHMARK}
              />
            ))}
          </div>

          {filteredAndSorted.length === 0 && !loading && (
            <div
              className="flex h-[200px] flex-col items-center justify-center
                rounded-none border border-dashed border-border"
            >
              <Typography variant="p2" textColor="muted-foreground">
                No opportunities found matching your criteria.
              </Typography>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <EarningsCalculator
            opportunities={opportunities.filter((o) => o.chain === "stacks")}
          />

          {/* Platform Stats Card */}
          <div className="rounded-none border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <Typography
                variant="p2"
                weight="bold"
                family="head"
                className="tracking-wider uppercase"
              >
                Platform Stats
              </Typography>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Typography variant="caption" textColor="muted-foreground">
                  Last Refresh
                </Typography>
                <Typography variant="caption" weight="medium" family="body">
                  {lastUpdated.toLocaleTimeString()}
                </Typography>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="caption" textColor="muted-foreground">
                  Active Protocols
                </Typography>
                <Typography variant="caption" weight="medium" family="body">
                  {opportunities.length}
                </Typography>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="caption" textColor="muted-foreground">
                  ETH Benchmark
                </Typography>
                <Typography variant="caption" weight="medium" family="body">
                  {ETH_BENCHMARK}% APY
                </Typography>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="caption" textColor="muted-foreground">
                  Bridge Bonus
                </Typography>
                <Badge
                  variant="secondary"
                  className="h-4 border-none bg-primary/20 text-[10px]
                    text-primary"
                >
                  +0.75% BXR
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
