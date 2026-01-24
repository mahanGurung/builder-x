"use client"

import { useQuery } from "@tanstack/react-query"
import { BarChart3, Shield } from "lucide-react"
import { useEffect, useMemo } from "react"
import type { Opportunity } from "@/types/opportunity"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Typography } from "@/components/global/typography"

type ProtocolSelectorProps = {
  value: string | null
  onValueChange: (opportunity: Opportunity) => void
}

async function fetchOpportunities(): Promise<Opportunity[]> {
  const res = await fetch("/api/opportunities", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch opportunities")
  const json = await res.json()
  return Array.isArray(json) ? json : json.data ?? []
}

export function ProtocolSelector({
  value,
  onValueChange,
}: ProtocolSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
    refetchInterval: 30_000,
  })

  const opportunities = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => (b.totalApy ?? 0) - (a.totalApy ?? 0))
  }, [data])

  // Default to highest APY once loaded
  useEffect(() => {
    if (value) return
    if (!opportunities.length) return
    onValueChange(opportunities[0])
  }, [value, opportunities, onValueChange])

  const selected = opportunities.find((o) => o.name === value) || null

  return (
    <div className="space-y-1">
      <Typography variant="caption" textColor="muted-foreground">
        Target Protocol
      </Typography>

      <Select
        value={value ?? undefined}
        onValueChange={(nextName) => {
          const next = opportunities.find((o) => o.name === nextName)
          if (next) onValueChange(next)
        }}
        disabled={isLoading || opportunities.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              isLoading ? "Loading protocols..." : "Select a protocol"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {opportunities.map((o) => (
            <SelectItem key={o.id} value={o.name}>
              <span className="flex flex-1 items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{o.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {o.chain.toUpperCase()} · Risk {o.riskScore} · $
                    {Math.round(o.tvl / 1_000_000)}M TVL
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="flex items-center gap-1 text-primary">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {(o.totalApy ?? o.currentApy).toFixed(2)}%
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                  </span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <Typography variant="caption" textColor="muted-foreground">
          Est. total APY:{" "}
          {(selected.totalApy ?? selected.currentApy).toFixed(2)}%
          {selected.chain === "stacks" ? " (includes bridge bonus)" : ""}
        </Typography>
      )}
    </div>
  )
}
