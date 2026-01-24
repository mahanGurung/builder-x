import { NextResponse } from "next/server"
import { apyScannerService } from "@/lib/services/apy-scanner"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()

  try {
    // Initialize service if not already done (seeds protocols)
    await apyScannerService.initialize()

    // Get opportunities from scanner
    const opportunities = await apyScannerService.getOpportunities()

    // Sort by total APY descending
    const sorted = opportunities.sort((a, b) => b.totalApy - a.totalApy)

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: sorted.map((opp) => ({
        id: opp.id,
        name: opp.name,
        chain: opp.chain,
        apy: opp.currentApy,
        totalApy: opp.totalApy,
        bridgeBonus: opp.bridgeBonus,
        riskScore: opp.riskScore,
        tvl: opp.tvl,
      })),
      meta: {
        count: sorted.length,
        lastUpdate: apyScannerService.getLastUpdateTime().toISOString(),
        responseTime: `${responseTime}ms`,
      },
    })
  } catch (error) {
    console.error("Error fetching opportunities:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch opportunities",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
