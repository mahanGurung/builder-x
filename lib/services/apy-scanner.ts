import type { Protocol } from "@/lib/generated/prisma/client"

export type Opportunity = Protocol & {
  totalApy: number
  bridgeBonus: number
}

const BRIDGE_BONUS_RATE = 0.0075 // 0.75% bridge rewards

// Mock protocol data for Ethereum
const ETHEREUM_PROTOCOLS = [
  {
    name: "Aave USDC",
    chain: "ethereum",
    currentApy: 3.5,
    riskScore: 2,
    tvl: 1500000000,
  },
  {
    name: "Compound USDC",
    chain: "ethereum",
    currentApy: 3.2,
    riskScore: 2,
    tvl: 1200000000,
  },
  {
    name: "MakerDAO DSR",
    chain: "ethereum",
    currentApy: 5.0,
    riskScore: 1,
    tvl: 5000000000,
  },
]

// Mock protocol data for Stacks
const STACKS_PROTOCOLS = [
  {
    name: "ALEX USDC Pool",
    chain: "stacks",
    currentApy: 8.5,
    riskScore: 4,
    tvl: 15000000,
  },
  {
    name: "Arkadiko Vault",
    chain: "stacks",
    currentApy: 7.2,
    riskScore: 3,
    tvl: 25000000,
  },
  {
    name: "Stackswap USDC",
    chain: "stacks",
    currentApy: 6.8,
    riskScore: 3,
    tvl: 12000000,
  },
  {
    name: "Velar USDC",
    chain: "stacks",
    currentApy: 9.1,
    riskScore: 5,
    tvl: 8000000,
  },
]

class ApyScannerService {
  private updateInterval: NodeJS.Timeout | null = null
  private lastUpdate: Date = new Date()
  private initialized: boolean = false

  async initialize() {
    if (this.initialized) return

    await this.seedProtocols()
    this.startAutoUpdate()
    this.initialized = true
  }

  private async seedProtocols() {
    try {
      // Lazy-load prisma to avoid bundling it client-side
      const { prisma } = await import("@/lib/db")
      const allProtocols = [...ETHEREUM_PROTOCOLS, ...STACKS_PROTOCOLS]

      for (const protocol of allProtocols) {
        await prisma.protocol.upsert({
          where: { name: protocol.name },
          update: {
            currentApy: protocol.currentApy,
            tvl: protocol.tvl,
          },
          create: protocol,
        })
      }

      console.log("Protocols seeded successfully")
    } catch (error) {
      console.error("Error seeding protocols:", error)
    }
  }

  async fetchEthereumRates(): Promise<Partial<Protocol>[]> {
    // In production, this would call real APIs (Aave, Compound, etc.)
    // For now, we return mock data with slight variations
    return ETHEREUM_PROTOCOLS.map((p) => ({
      ...p,
      currentApy: p.currentApy + (Math.random() - 0.5) * 0.5,
    }))
  }

  async fetchStacksRates(): Promise<Partial<Protocol>[]> {
    // In production, this would call real APIs (ALEX, Arkadiko, etc.)
    // For now, we return mock data with slight variations
    return STACKS_PROTOCOLS.map((p) => ({
      ...p,
      currentApy: p.currentApy + (Math.random() - 0.5) * 1.0,
    }))
  }

  async updateProtocolData() {
    try {
      const startTime = Date.now()

      // Lazy-load prisma to avoid bundling it client-side
      const { prisma } = await import("@/lib/db")

      // Fetch rates from both chains in parallel
      const [ethereumRates, stacksRates] = await Promise.all([
        this.fetchEthereumRates(),
        this.fetchStacksRates(),
      ])

      const allRates = [...ethereumRates, ...stacksRates]

      // Update database
      await Promise.all(
        allRates.map(async (rate) => {
          if (!rate.name) return

          return prisma.protocol.upsert({
            where: { name: rate.name },
            update: {
              currentApy: rate.currentApy ?? 0,
              tvl: rate.tvl ?? 0,
            },
            create: {
              name: rate.name,
              chain: rate.chain ?? "ethereum",
              currentApy: rate.currentApy ?? 0,
              riskScore: rate.riskScore ?? 5,
              tvl: rate.tvl ?? 0,
            },
          })
        })
      )

      this.lastUpdate = new Date()
      const duration = Date.now() - startTime

      console.log(`Protocol data updated in ${duration}ms`)

      return { success: true, duration }
    } catch (error) {
      console.error("Error updating protocol data:", error)
      // Gracefully handle failures by returning cached data
      return { success: false, error }
    }
  }

  startAutoUpdate() {
    // Update every 30 seconds
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(() => {
      this.updateProtocolData()
    }, 30 * 1000)

    console.log("Auto-update started (30 second interval)")
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log("Auto-update stopped")
    }
  }

  async getOpportunities(): Promise<Opportunity[]> {
    try {
      // Lazy-load prisma to avoid bundling it client-side
      const { prisma } = await import("@/lib/db")

      const protocols = await prisma.protocol.findMany({
        orderBy: { currentApy: "desc" },
      })

      // Calculate total APY including bridge bonus for Stacks protocols
      const opportunities = protocols.map((protocol) => {
        const bridgeBonus =
          protocol.chain === "stacks" ? BRIDGE_BONUS_RATE * 100 : 0
        const totalApy = protocol.currentApy + bridgeBonus

        return {
          ...protocol,
          bridgeBonus,
          totalApy,
        }
      })

      return opportunities
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      // Return fallback data on error
      return this.getFallbackData()
    }
  }

  private getFallbackData(): Opportunity[] {
    // Return cached/fallback data if database fails
    return [...ETHEREUM_PROTOCOLS, ...STACKS_PROTOCOLS].map((p) => ({
      id: p.name,
      name: p.name,
      chain: p.chain,
      currentApy: p.currentApy,
      riskScore: p.riskScore,
      tvl: p.tvl,
      bridgeBonus: p.chain === "stacks" ? BRIDGE_BONUS_RATE * 100 : 0,
      totalApy:
        p.currentApy + (p.chain === "stacks" ? BRIDGE_BONUS_RATE * 100 : 0),
      updatedAt: new Date(),
    }))
  }

  getLastUpdateTime(): Date {
    return this.lastUpdate
  }
}

// Singleton instance (deferred initialization)
let apyScannerServiceInstance: ApyScannerService | null = null

export function getApyScannerService(): ApyScannerService {
  if (!apyScannerServiceInstance) {
    apyScannerServiceInstance = new ApyScannerService()
    // Do not call initialize() here directly, it should be called explicitly after the app starts.
  }
  return apyScannerServiceInstance
}
