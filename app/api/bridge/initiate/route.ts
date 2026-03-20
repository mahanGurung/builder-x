import { NextResponse } from "next/server"
import type { BridgeInitiateRequest } from "@/types/bridge"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BridgeInitiateRequest

    if (!body?.amount || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    if (!body?.ethAddress || !body?.stacksAddress) {
      return NextResponse.json(
        { error: "Missing wallet addresses" },
        { status: 400 }
      )
    }

    // Simple Bridge: Circle handles delivery — no backend call needed
    if (body.mode === "simple") {
      return NextResponse.json({
        requestId: body.depositTxHash ?? "simple-bridge",
        status: "initiated",
      })
    }

    // Fast Bridge: notify Rust backend to register user and queue distribution
    const backendUrl =
      process.env.GIVER_BACKEND_URL ?? "http://localhost:3001"
    try {
      const backendRes = await fetch(`${backendUrl}/register-from-website`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eth_address: body.ethAddress,
          stacks_address: body.stacksAddress,
          deposit_tx_hash: body.depositTxHash,
          amount: body.amount,
        }),
      })

      if (backendRes.ok) {
        const data = await backendRes.json()
        return NextResponse.json({
          requestId: data.request_id ?? body.depositTxHash ?? "fast-bridge",
          status: "initiated",
        })
      }
    } catch (backendErr) {
      console.warn(
        "Rust backend unavailable, returning stub response:",
        backendErr
      )
    }

    // Stub if backend is unavailable
    return NextResponse.json({
      requestId: body.depositTxHash ?? "fast-bridge",
      status: "initiated",
    })
  } catch (error) {
    console.error("/api/bridge/initiate error", error)
    return NextResponse.json(
      { error: "Failed to initiate bridge" },
      { status: 500 }
    )
  }
}
