export type BridgeInitiateRequest = {
  amount: number
  targetProtocol: string
  autoDeploy: boolean
  referrerCode?: string
  ethAddress: string
  stacksAddress: string
}

export type BridgeStatus = "initiated" | "attesting" | "registered" | "failed"

export type BridgeInitiateResponse = {
  requestId: string
  status: BridgeStatus
  ethTxHash: string
  stacksTxId?: string
}

export type BridgeStatusResponse = {
  requestId: string
  status: BridgeStatus
  ethTxHash: string
  stacksTxId?: string
  error?: string
}
