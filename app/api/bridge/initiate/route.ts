import { NextResponse } from "next/server"
import type { BridgeInitiateRequest } from "@/types/bridge"
import { xreserveService } from "@/lib/services/xreserve-service"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BridgeInitiateRequest

    if (!body?.amount || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    if (!body?.targetProtocol) {
      return NextResponse.json(
        { error: "Missing targetProtocol" },
        { status: 400 }
      )
    }
    if (!body?.ethAddress || !body?.stacksAddress) {
      return NextResponse.json(
        { error: "Missing wallet addresses" },
        { status: 400 }
      )
    }

    const result = xreserveService.initiateBridge(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error("/api/bridge/initiate error", error)
    return NextResponse.json(
      { error: "Failed to initiate bridge" },
      { status: 500 }
    )
  }
}
