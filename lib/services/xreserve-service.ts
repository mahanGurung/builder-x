import crypto from "crypto"
import type {
  BridgeInitiateRequest,
  BridgeInitiateResponse,
  BridgeStatusResponse,
} from "@/types/bridge"

type StoredBridge = {
  requestId: string
  status: BridgeStatusResponse["status"]
  ethTxHash: string
  stacksTxId?: string
  error?: string
  createdAt: number
  request: BridgeInitiateRequest
}

const store = new Map<string, StoredBridge>()

function mockTxHash(prefix: string) {
  const rand = crypto.randomBytes(32).toString("hex")
  return `0x${prefix}${rand.slice(prefix.length)}`
}

function scheduleMockProgress(requestId: string) {
  // Note: timers are best-effort in dev; this is a mock for local testing.
  setTimeout(() => {
    const current = store.get(requestId)
    if (!current || current.status !== "initiated") return
    store.set(requestId, { ...current, status: "attesting" })
  }, 2_000)

  setTimeout(() => {
    const current = store.get(requestId)
    if (
      !current ||
      (current.status !== "initiated" && current.status !== "attesting")
    ) {
      return
    }

    store.set(requestId, {
      ...current,
      status: "registered",
      stacksTxId: `0x${crypto.randomBytes(16).toString("hex")}`,
    })
  }, 8_000)
}

export const xreserveService = {
  initiateBridge: (req: BridgeInitiateRequest): BridgeInitiateResponse => {
    const requestId = crypto.randomUUID()

    const record: StoredBridge = {
      requestId,
      status: "initiated",
      ethTxHash: mockTxHash("e"),
      createdAt: Date.now(),
      request: req,
    }

    store.set(requestId, record)
    scheduleMockProgress(requestId)

    return {
      requestId,
      status: record.status,
      ethTxHash: record.ethTxHash,
    }
  },

  getStatus: (requestId: string): BridgeStatusResponse | null => {
    const record = store.get(requestId)
    if (!record) return null
    return {
      requestId: record.requestId,
      status: record.status,
      ethTxHash: record.ethTxHash,
      stacksTxId: record.stacksTxId,
      error: record.error,
    }
  },
}
