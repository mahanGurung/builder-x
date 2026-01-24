export type Opportunity = {
  id: string
  name: string
  chain: "ethereum" | "stacks"
  currentApy: number
  riskScore: number
  tvl: number
  bridgeBonus: number
  totalApy: number
}
