import { NextResponse } from "next/server"
import type { UsdcDepositStatus } from "@/types/bridge"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const txHash = searchParams.get("txHash")
  const network = searchParams.get("network") || "testnet"
  const networkStr = network === "mainnet" ? "mainnet" : "testnet"

  if (!txHash) {
    return NextResponse.json({ status: "pending" } satisfies UsdcDepositStatus)
  }

  try {
    const res = await fetch(
      `https://api.usdc-on-stacks.com/${networkStr}/deposits`,
      { cache: "no-store" }
    )

    if (!res.ok) {
      return NextResponse.json({ status: "pending" } satisfies UsdcDepositStatus)
    }

    const data = await res.json()
    const deposits: any[] = Array.isArray(data) ? data : data.deposits ?? []
    const deposit = deposits.find(
      (d: any) =>
        d.txHash === txHash || d.tx_hash === txHash || d.ethTxHash === txHash
    )

    if (!deposit) {
      return NextResponse.json({ status: "pending" } satisfies UsdcDepositStatus)
    }

    const rawStatus: string = deposit.status ?? ""
    const status: UsdcDepositStatus["status"] =
      rawStatus === "invalid"
        ? "invalid"
        : rawStatus === "completed" || rawStatus === "confirmed"
        ? "completed"
        : rawStatus === "failed"
        ? "failed"
        : "pending"

    return NextResponse.json({
      status,
      txHash: deposit.txHash ?? deposit.tx_hash,
      amount: deposit.amount,
      recipient: deposit.recipient,
    } satisfies UsdcDepositStatus)
  } catch {
    return NextResponse.json({ status: "pending" } satisfies UsdcDepositStatus)
  }
}
