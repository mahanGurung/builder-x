export type UsdcDepositStatus = {
  status: "pending" | "completed" | "invalid" | "failed"
  txHash?: string
  amount?: number
  recipient?: string
}

export type BridgeInitiateRequest = {
  amount: number
  mode: "fast" | "simple"
  targetProtocol?: string
  autoDeploy: boolean
  referrerCode?: string
  ethAddress: string
  stacksAddress: string
  depositTxHash?: string
}

export type BridgeStatus =
  | "initiated"
  | "attesting"
  | "registered"
  | "failed"
  | "distributing"
  | "completed"

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

/**
 * Vault state from the smart contract
 * Represents the dual-balance system:
 * - vaultBalance: Manually tracked balance (deprecated, kept for compatibility)
 * - actualBalance: Real USDCx balance (from SIP-10 token standard)
 * - rewardBalance: Accumulated 2 USDC fees
 * - isPaused: Whether the vault is paused
 *
 * Transfer logic:
 * - User must send: transferAmount + 2 USDC fee on Ethereum
 * - Contract requires: actualBalance >= transferAmount
 * - Fee accumulates in rewardBalance
 */
export type VaultState = {
  /** Manually tracked vault balance in microUSDC */
  vaultBalance: bigint
  /** Real USDCx balance in contract (from SIP-10) in microUSDC */
  actualBalance: bigint
  /** Accumulated 2 USDC fees from transfers in microUSDC */
  rewardBalance: bigint
  /** Whether the vault is currently paused */
  isPaused: boolean
}
