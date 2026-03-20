import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params
  const backendUrl = process.env.GIVER_BACKEND_URL ?? "http://localhost:3001"

  try {
    const res = await fetch(`${backendUrl}/bridge/status/${requestId}`, {
      cache: "no-store",
    })

    if (res.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Failed to reach Rust backend for bridge status:", err)
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 })
  }
}
