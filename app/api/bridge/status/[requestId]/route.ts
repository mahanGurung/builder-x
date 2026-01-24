import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { xreserveService } from "@/lib/services/xreserve-service"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params
  const status = xreserveService.getStatus(requestId)

  if (!status) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(status)
}
