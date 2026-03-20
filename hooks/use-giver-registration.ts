"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  createGiverClient,
  type GiverError,
  type RegisterResponse,
  type VaultState,
} from "@/lib/giver-sdk"

export interface UseGiverRegistrationReturn {
  isLoading: boolean
  isRegistered: boolean
  error: string | null
  vaultBalance: bigint | null
  actualBalance: bigint | null
  rewardBalance: bigint | null
  isVaultPaused: boolean | null
  insufficientVaultLiquidity: boolean
  insufficientFastBridgeFunds: boolean
  isBalanceLoading: boolean
  registerUser: (
    ethAddress: string,
    stacksAddress: string,
    signature: string,
    message: string
  ) => Promise<RegisterResponse | null>
  lookupUser: (address: string, type: "eth" | "stacks") => Promise<boolean>
  getVaultState: () => Promise<VaultState | null>
  getActualBalance: () => Promise<bigint | null>
  clearError: () => void
}

/**
 * Custom React hook for managing Giver registration state and operations
 * Handles user registration, lookup, vault state, and error management
 * Implements balance caching (5-10 seconds) to avoid excessive API calls
 *
 * @param requestedAmount - Optional amount requested for transfer (in microUSDC)
 * @returns Object containing registration state and handler functions
 *
 * @example
 * ```typescript
 * const { isLoading, error, registerUser, getVaultState, actualBalance, clearError } = useGiverRegistration()
 *
 * const handleRegister = async () => {
 *   try {
 *     const vaultState = await getVaultState()
 *     if (vaultState && vaultState.actualBalance >= requestedAmount) {
 *       await registerUser(ethAddress, stacksAddress, signature, message)
 *     }
 *   } catch (error) {
 *     console.error(error)
 *   }
 * }
 * ```
 */
export function useGiverRegistration(
  requestedAmount?: bigint,
  userUsdcBalance?: bigint
): UseGiverRegistrationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultBalance, setVaultBalance] = useState<bigint | null>(null)
  const [actualBalance, setActualBalance] = useState<bigint | null>(null)
  const [rewardBalance, setRewardBalance] = useState<bigint | null>(null)
  const [isVaultPaused, setIsVaultPaused] = useState<boolean | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)

  // Balance cache with 8-second TTL (cache timestamp and value)
  const balanceCacheRef = useRef<{
    timestamp: number
    balance: bigint
  } | null>(null)
  const balanceCacheTTL = 8000 // 8 seconds

  // Get API URL from environment
  const apiUrl =
    typeof window !== "undefined" &&
    (window as any).__GIVER_API_URL__ ||
    process.env.NEXT_PUBLIC_GIVER_API_URL ||
    "http://localhost:3001"

  // Calculate insufficient liquidity (actualBalance < requestedAmount + 2 USDC fee)
  // 2 USDC = 2,000,000 microUSDC
  const insufficientVaultLiquidity =
    actualBalance !== null &&
    requestedAmount !== undefined &&
    actualBalance < requestedAmount + BigInt(2000000)

  // Check if user has enough USDC for Fast Bridge (amount + 2 USDC fee)
  const insufficientFastBridgeFunds =
    userUsdcBalance !== undefined && requestedAmount !== undefined
      ? userUsdcBalance < requestedAmount + BigInt(2_000_000)
      : false

  /**
   * Register a user by mapping Ethereum address to Stacks address
   * @param ethAddress - Ethereum address
   * @param stacksAddress - Stacks address
   * @param signature - Signed message
   * @param message - Original message that was signed
   * @returns Promise with registration response
   */
  const registerUser = useCallback(
    async (
      ethAddress: string,
      stacksAddress: string,
      signature: string,
      message: string
    ): Promise<RegisterResponse | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const client = createGiverClient(apiUrl, "testnet")
        const response = await client.registerUser(
          ethAddress,
          stacksAddress,
          signature,
          message
        )

        if (response.success) {
          setIsRegistered(true)
          return response
        } else {
          setError(response.message || "Registration failed")
          return null
        }
      } catch (err) {
        const giverError = err as GiverError & Error
        const errorMessage =
          giverError.message ||
          (typeof err === "string" ? err : "Registration failed")
        setError(errorMessage)
        console.error("Registration error:", err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [apiUrl]
  )

  /**
   * Look up a user by their Ethereum or Stacks address
   * @param address - Address to lookup
   * @param type - Type of address (eth or stacks)
   * @returns Promise<boolean> - Whether user was found
   */
  const lookupUser = useCallback(
    async (address: string, type: "eth" | "stacks"): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const client = createGiverClient(apiUrl, "testnet")
        const response =
          type === "eth"
            ? await client.lookupUser(address)
            : await client.lookupUser(undefined, address)

        if (response.found) {
          setIsRegistered(true)
          return true
        } else {
          setIsRegistered(false)
          return false
        }
      } catch (err) {
        const giverError = err as GiverError & Error
        const errorMessage =
          giverError.message ||
          (typeof err === "string" ? err : "Lookup failed")
        setError(errorMessage)
        console.error("Lookup error:", err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [apiUrl]
  )

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Get the complete vault state including balances and pause status
   * @returns Promise with vault state
   */
  const getVaultState = useCallback(async (): Promise<VaultState | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const client = createGiverClient(apiUrl, "testnet")
      const state = await client.getVaultState()

      // Update state variables
      setVaultBalance(state.vaultBalance)
      setActualBalance(state.actualBalance)
      setRewardBalance(state.rewardBalance)
      setIsVaultPaused(state.isPaused)

      // Update balance cache
      balanceCacheRef.current = {
        timestamp: Date.now(),
        balance: state.actualBalance,
      }

      return state
    } catch (err) {
      const giverError = err as GiverError & Error
      const errorMessage =
        giverError.message ||
        (typeof err === "string" ? err : "Failed to retrieve vault state")
      setError(errorMessage)
      console.error("Vault state error:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl])

  /**
   * Get the actual balance from the vault
   * Uses cached value if available and not expired (TTL: 8 seconds)
   * Otherwise fetches fresh balance from the service
   * @returns Promise with actual balance in microUSDC
   */
  const getActualBalance = useCallback(async (): Promise<bigint | null> => {
    setIsBalanceLoading(true)
    setError(null)

    try {
      // Check if we have a valid cached balance
      const now = Date.now()
      if (
        balanceCacheRef.current &&
        now - balanceCacheRef.current.timestamp < balanceCacheTTL
      ) {
        setActualBalance(balanceCacheRef.current.balance)
        return balanceCacheRef.current.balance
      }

      // Fetch fresh balance from API
      const client = createGiverClient(apiUrl, "testnet")
      const balance = await client.getActualBalance()

      // Update state and cache
      setActualBalance(balance)
      balanceCacheRef.current = {
        timestamp: now,
        balance,
      }

      return balance
    } catch (err) {
      const giverError = err as GiverError & Error
      const errorMessage =
        giverError.message ||
        (typeof err === "string" ? err : "Failed to retrieve balance")
      setError(errorMessage)
      console.error("Balance error:", err)
      return null
    } finally {
      setIsBalanceLoading(false)
    }
  }, [apiUrl])

  return {
    isLoading,
    isRegistered,
    error,
    vaultBalance,
    actualBalance,
    rewardBalance,
    isVaultPaused,
    insufficientVaultLiquidity,
    insufficientFastBridgeFunds,
    isBalanceLoading,
    registerUser,
    lookupUser,
    getVaultState,
    getActualBalance,
    clearError,
  }
}
