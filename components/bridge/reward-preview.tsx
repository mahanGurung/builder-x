"use client"

import { Coins, Gift, Layers, TrendingUp, Zap } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Typography } from "@/components/global/typography"

type RewardBreakdown = {
  base: number
  autoDeployBonus: number
  referralBonus: number
  multiplier: number
  multiplierTier: number
  total: number
}

type RewardPreviewProps = {
  amount: number // USDC amount (human readable, e.g., 1000)
  autoDeploy: boolean
  hasReferral: boolean
  userTotalBridged: number // User's cumulative bridged amount
  className?: string
}

// Constants matching the smart contract
const BASE_REWARD_RATE = 0.0075 // 0.75%
const AUTO_DEPLOY_BONUS = 0.3 // +30% of base
const REFERRAL_BONUS = 0.1 // +10% of base

// Tier thresholds in USDC
const TIER_THRESHOLDS = [
  { min: 0, multiplier: 1.0, tier: 1 },
  { min: 1000, multiplier: 1.5, tier: 2 },
  { min: 10000, multiplier: 2.0, tier: 3 },
  { min: 50000, multiplier: 3.0, tier: 4 },
]

function getMultiplierTier(totalBridged: number) {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalBridged >= TIER_THRESHOLDS[i].min) {
      return TIER_THRESHOLDS[i]
    }
  }
  return TIER_THRESHOLDS[0]
}

function calculateRewards(
  amount: number,
  autoDeploy: boolean,
  hasReferral: boolean,
  userTotalBridged: number
): RewardBreakdown {
  // Base rewards: 0.75% of amount
  const base = amount * BASE_REWARD_RATE

  // Auto-deploy bonus: +30% of base
  const autoDeployBonus = autoDeploy ? base * AUTO_DEPLOY_BONUS : 0

  // Referral bonus: +10% of base
  const referralBonus = hasReferral ? base * REFERRAL_BONUS : 0

  // Get volume multiplier
  const tierInfo = getMultiplierTier(userTotalBridged)
  const multiplier = tierInfo.multiplier

  // Total before multiplier
  const subtotal = base + autoDeployBonus + referralBonus

  // Apply multiplier
  const total = subtotal * multiplier

  return {
    base,
    autoDeployBonus,
    referralBonus,
    multiplier,
    multiplierTier: tierInfo.tier,
    total,
  }
}

function formatBXR(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }
  return value.toFixed(2)
}

export function RewardPreview({
  amount,
  autoDeploy,
  hasReferral,
  userTotalBridged,
  className,
}: RewardPreviewProps) {
  const rewards = useMemo(
    () => calculateRewards(amount, autoDeploy, hasReferral, userTotalBridged),
    [amount, autoDeploy, hasReferral, userTotalBridged]
  )

  const nextTier = TIER_THRESHOLDS.find(
    (t) => t.tier === rewards.multiplierTier + 1
  )
  const progressToNextTier = nextTier
    ? Math.min(100, ((userTotalBridged + amount) / nextTier.min) * 100)
    : 100

  return (
    <div
      className={cn(
        `relative overflow-hidden border border-primary/20 bg-card/50
        backdrop-blur-sm`,
        className
      )}
    >
      {/* Background Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center bg-primary/10"
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
            </div>
            <Typography variant="p2" family="head" weight="semibold">
              Reward Preview
            </Typography>
          </div>
          <div
            className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5
              text-primary"
          >
            <TrendingUp className="h-3 w-3" />
            <Typography variant="caption" weight="bold">
              {rewards.multiplier}x MULTIPLIER
            </Typography>
          </div>
        </div>
      </div>

      {/* Reward Breakdown */}
      <div className="space-y-3 p-4">
        {/* Base Rewards */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <Typography variant="caption">Base Rewards (0.75%)</Typography>
          </div>
          <Typography variant="p2" family="body" weight="medium">
            {formatBXR(rewards.base)} BXR
          </Typography>
        </div>

        {/* Auto-Deploy Bonus */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap
              className={cn("h-3.5 w-3.5", autoDeploy && "text-yellow-500")}
            />
            <Typography variant="caption">Auto-Deploy Bonus (+30%)</Typography>
          </div>
          <Typography
            variant="p2"
            family="body"
            weight="medium"
            className={cn(!autoDeploy && "text-muted-foreground")}
          >
            {autoDeploy ? `+${formatBXR(rewards.autoDeployBonus)} BXR` : "—"}
          </Typography>
        </div>

        {/* Referral Bonus */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gift
              className={cn("h-3.5 w-3.5", hasReferral && "text-purple-500")}
            />
            <Typography variant="caption">Referral Bonus (+10%)</Typography>
          </div>
          <Typography
            variant="p2"
            family="body"
            weight="medium"
            className={cn(!hasReferral && "text-muted-foreground")}
          >
            {hasReferral ? `+${formatBXR(rewards.referralBonus)} BXR` : "—"}
          </Typography>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border/50" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <Typography variant="p2" family="head" weight="semibold">
            Total Rewards
          </Typography>
          <div className="text-right">
            <Typography
              variant="h5"
              family="head"
              weight="bold"
              className="text-primary"
            >
              {formatBXR(rewards.total)} BXR
            </Typography>
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="block"
            >
              ≈ ${(rewards.total * 0.1).toFixed(2)} USD
            </Typography>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <Typography variant="caption" textColor="muted-foreground">
              Progress to Tier {nextTier.tier} ({nextTier.multiplier}x)
            </Typography>
            <Typography variant="caption" weight="medium">
              ${(userTotalBridged + amount).toLocaleString()} / $
              {nextTier.min.toLocaleString()}
            </Typography>
          </div>
          <div className="h-1.5 w-full overflow-hidden bg-border/50">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressToNextTier}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export { calculateRewards, getMultiplierTier, TIER_THRESHOLDS }
