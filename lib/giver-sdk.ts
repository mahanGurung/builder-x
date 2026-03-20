/**
 * Giver SDK - TypeScript client for interacting with the Giver Rust service
 * Handles cross-chain USDC transfer registration and lookup
 */

/**
 * Configuration for the Giver client
 */
export interface GiverConfig {
  /** API base URL (e.g., http://localhost:3001) */
  apiUrl: string
  /** Blockchain network: testnet or mainnet */
  network: "testnet" | "mainnet"
}

/**
 * Vault state information from the smart contract
 * The vault maintains two balances:
 * - vaultBalance: Manually tracked balance in the contract
 * - actualBalance: Real USDCx balance in contract (from SIP-10 token standard)
 * - rewardBalance: Accumulated 2 USDC fees collected from users
 * - isPaused: Whether the vault is currently paused
 */
export interface VaultState {
  /** Manually tracked vault balance in microUSDC */
  vaultBalance: bigint
  /** Real USDCx balance in contract (from SIP-10) in microUSDC */
  actualBalance: bigint
  /** Accumulated 2 USDC fees from transfers in microUSDC */
  rewardBalance: bigint
  /** Whether the vault is currently paused */
  isPaused: boolean
}

/**
 * Response from user registration endpoint
 */
export interface RegisterResponse {
  /** Whether the registration was successful */
  success: boolean
  /** Message describing the result */
  message: string
  /** User ID assigned by the service (if successful) */
  user_id?: number
  /** Ethereum address registered */
  eth_address?: string
  /** Stacks address registered */
  stacks_address?: string
}

/**
 * Response from user lookup endpoint
 */
export interface LookupResponse {
  /** Whether the user was found */
  found: boolean
  /** Ethereum address (if found) */
  eth_address?: string
  /** Stacks address (if found) */
  stacks_address?: string
}

/**
 * Response from health check endpoint
 */
export interface HealthResponse {
  /** Health status */
  status: "ok" | "error"
  /** ISO timestamp of the health check */
  timestamp?: string
}

/**
 * Response from vault state endpoint
 */
export interface VaultStateResponse {
  /** Whether the request was successful */
  success: boolean
  /** Vault state information */
  data?: VaultState
  /** Error message if unsuccessful */
  error?: string
}

/**
 * Response from actual balance endpoint
 */
export interface ActualBalanceResponse {
  /** Whether the request was successful */
  success: boolean
  /** Actual USDCx balance in microUSDC */
  balance?: bigint
  /** Error message if unsuccessful */
  error?: string
}

/**
 * Response from reward balance endpoint
 */
export interface RewardBalanceResponse {
  /** Whether the request was successful */
  success: boolean
  /** Accumulated fees in microUSDC */
  balance?: bigint
  /** Error message if unsuccessful */
  error?: string
}

/**
 * Response from vault pause status endpoint
 */
export interface VaultPauseStatusResponse {
  /** Whether the request was successful */
  success: boolean
  /** Whether the vault is paused */
  isPaused?: boolean
  /** Error message if unsuccessful */
  error?: string
}

/**
 * Error type for Giver client operations
 */
export class GiverError extends Error {
  constructor(
    public code: string,
    public originalError?: Error
  ) {
    super(code)
    this.name = "GiverError"
  }
}

/**
 * Giver client for interacting with the Giver bridge service
 * Provides methods for user registration, lookup, and health checks
 */
export class GiverClient {
  private readonly apiUrl: string
  private readonly network: "testnet" | "mainnet"
  private readonly timeout: number = 30000 // 30 second timeout

  /**
   * Creates a new Giver client instance
   * @param config - Configuration object with apiUrl and network
   */
  constructor(config: GiverConfig) {
    if (!config.apiUrl) {
      throw new Error("apiUrl is required in GiverConfig")
    }
    this.apiUrl = config.apiUrl.replace(/\/$/, "") // Remove trailing slash
    this.network = config.network
  }

  /**
   * Register a user by mapping their Ethereum address to their Stacks address
   * Requires a signature to prove ownership of the Ethereum address
   *
   * @param ethAddress - Ethereum address (0x-prefixed hex)
   * @param stacksAddress - Stacks address (SP or ST prefix)
   * @param signature - Signed message proof (65 bytes, 0x-prefixed hex)
   * @param message - Original message that was signed
   * @returns Promise resolving to registration response
   * @throws GiverError on network, validation, or service errors
   *
   * @example
   * ```typescript
   * const response = await giverClient.registerUser(
   *   "0x1234567890abcdef1234567890abcdef12345678",
   *   "SP1234567890ABCDEF1234567890ABCDEF1234567890",
   *   "0xabcd...",
   *   "Register me on the bridge"
   * )
   * ```
   */
  async registerUser(
    ethAddress: string,
    stacksAddress: string,
    signature: string,
    message: string
  ): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>("/register", {
      method: "POST",
      body: {
        eth_address: ethAddress,
        stacks_address: stacksAddress,
        signature,
        message,
      },
    })
  }

  /**
   * Look up a user by their Ethereum or Stacks address
   * At least one address parameter must be provided
   *
   * @param ethAddress - Ethereum address to lookup (optional)
   * @param stacksAddress - Stacks address to lookup (optional)
   * @returns Promise resolving to lookup response with matching addresses
   * @throws GiverError on network, validation, or service errors
   *
   * @example
   * ```typescript
   * // Lookup by Ethereum address
   * const result = await giverClient.lookupUser("0x1234...")
   *
   * // Lookup by Stacks address
   * const result = await giverClient.lookupUser(undefined, "SP1234...")
   *
   * // Lookup by either address
   * const result = await giverClient.lookupUser("0x1234...", "SP1234...")
   * ```
   */
  async lookupUser(
    ethAddress?: string,
    stacksAddress?: string
  ): Promise<LookupResponse> {
    if (!ethAddress && !stacksAddress) {
      throw new GiverError(
        "INVALID_INPUT",
        new Error("At least one address (ethAddress or stacksAddress) is required")
      )
    }

    const params = new URLSearchParams()
    if (ethAddress) params.append("eth_address", ethAddress)
    if (stacksAddress) params.append("stacks_address", stacksAddress)

    return this.makeRequest<LookupResponse>(`/lookup?${params.toString()}`, {
      method: "GET",
    })
  }

  /**
   * Check the health status of the Giver service
   *
   * @returns Promise resolving to health status
   * @throws GiverError on network or service errors
   *
   * @example
   * ```typescript
   * const health = await giverClient.checkHealth()
   * if (health.status === "ok") {
   *   console.log("Service is healthy")
   * }
   * ```
   */
  async checkHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>("/health", {
      method: "GET",
    })
  }

  /**
   * Get the complete vault state including balances and pause status
   * Queries vault balance, actual balance, reward balance, and pause status
   *
   * @returns Promise resolving to vault state
   * @throws GiverError on network or service errors
   *
   * @example
   * ```typescript
   * const vaultState = await giverClient.getVaultState()
   * console.log("Vault balance:", vaultState.vaultBalance)
   * console.log("Actual balance:", vaultState.actualBalance)
   * console.log("Reward balance:", vaultState.rewardBalance)
   * console.log("Is paused:", vaultState.isPaused)
   * ```
   */
  async getVaultState(): Promise<VaultState> {
    const response = await this.makeRequest<VaultStateResponse>("/vault/state", {
      method: "GET",
    })

    if (!response.success || !response.data) {
      throw new GiverError(
        "VAULT_STATE_ERROR",
        new Error(response.error || "Failed to retrieve vault state")
      )
    }

    return response.data
  }

  /**
   * Get the actual USDCx balance in the vault from the blockchain
   * This represents the real balance that can be transferred
   *
   * @returns Promise resolving to actual balance in microUSDC
   * @throws GiverError on network or service errors
   *
   * @example
   * ```typescript
   * const balance = await giverClient.getActualBalance()
   * console.log("Actual balance:", balance.toString())
   * ```
   */
  async getActualBalance(): Promise<bigint> {
    const response = await this.makeRequest<ActualBalanceResponse>(
      "/vault/actual-balance",
      {
        method: "GET",
      }
    )

    if (!response.success || response.balance === undefined) {
      throw new GiverError(
        "ACTUAL_BALANCE_ERROR",
        new Error(response.error || "Failed to retrieve actual balance")
      )
    }

    return response.balance
  }

  /**
   * Get the accumulated reward/fee balance in the vault
   * These are the 2 USDC fees collected from transfers
   *
   * @returns Promise resolving to reward balance in microUSDC
   * @throws GiverError on network or service errors
   *
   * @example
   * ```typescript
   * const rewards = await giverClient.getRewardBalance()
   * console.log("Accumulated fees:", rewards.toString())
   * ```
   */
  async getRewardBalance(): Promise<bigint> {
    const response = await this.makeRequest<RewardBalanceResponse>(
      "/vault/reward-balance",
      {
        method: "GET",
      }
    )

    if (!response.success || response.balance === undefined) {
      throw new GiverError(
        "REWARD_BALANCE_ERROR",
        new Error(response.error || "Failed to retrieve reward balance")
      )
    }

    return response.balance
  }

  /**
   * Check if the vault is currently paused
   * A paused vault will not accept new transfers
   *
   * @returns Promise resolving to pause status
   * @throws GiverError on network or service errors
   *
   * @example
   * ```typescript
   * const isPaused = await giverClient.isVaultPaused()
   * if (isPaused) {
   *   console.log("Vault is paused - transfers not available")
   * }
   * ```
   */
  async isVaultPaused(): Promise<boolean> {
    const response = await this.makeRequest<VaultPauseStatusResponse>(
      "/vault/is-paused",
      {
        method: "GET",
      }
    )

    if (!response.success || response.isPaused === undefined) {
      throw new GiverError(
        "VAULT_PAUSE_STATUS_ERROR",
        new Error(response.error || "Failed to retrieve vault pause status")
      )
    }

    return response.isPaused
  }

  /**
   * Internal method for making HTTP requests to the Giver service
   * Handles timeouts, errors, and response parsing
   *
   * @param endpoint - API endpoint path (e.g., "/register")
   * @param options - Fetch options (method, body, etc.)
   * @returns Parsed JSON response
   * @throws GiverError with appropriate error code
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method: "GET" | "POST"
      body?: Record<string, string | number>
    }
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const fetchOptions: RequestInit = {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      }

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body)
      }

      const response = await fetch(url, fetchOptions)

      // Handle HTTP error responses
      if (!response.ok) {
        const text = await response.text()
        let errorMessage = `HTTP ${response.status}`

        try {
          const errorJson = JSON.parse(text)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          // If response isn't JSON, use the text or status
          errorMessage = text || errorMessage
        }

        throw new GiverError(`HTTP_${response.status}`, new Error(errorMessage))
      }

      // Parse JSON response with bigint support
      const text = await response.json()
      const data = this.parseBigInt(text) as T
      return data
    } catch (error) {
      if (error instanceof GiverError) {
        throw error
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new GiverError(
          "TIMEOUT",
          new Error(`Request timeout after ${this.timeout}ms`)
        )
      }

      // Handle fetch errors (network errors, etc.)
      if (error instanceof Error) {
        throw new GiverError("NETWORK_ERROR", error)
      }

      throw new GiverError("UNKNOWN_ERROR", new Error(String(error)))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Parse JSON string handling bigint values (numeric strings that represent large integers)
   * @param obj - Object to parse
   * @returns Parsed object with bigint values converted
   */
  private parseBigInt(obj: any): any {
    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map((item) => this.parseBigInt(item))
      }
      const result: any = {}
      for (const key in obj) {
        const value = obj[key]
        // Convert string values that look like large numbers to bigint
        if (
          typeof value === "string" &&
          /^\d+$/.test(value) &&
          value.length > 15
        ) {
          result[key] = BigInt(value)
        } else if (typeof value === "object") {
          result[key] = this.parseBigInt(value)
        } else {
          result[key] = value
        }
      }
      return result
    }
    return obj
  }
}

/**
 * Factory function to create a Giver client instance
 * Provides a convenient way to instantiate the client with sensible defaults
 *
 * @param apiUrl - Base URL of the Giver service
 * @param network - Blockchain network (testnet or mainnet)
 * @returns Configured GiverClient instance
 *
 * @example
 * ```typescript
 * const client = createGiverClient(
 *   "http://localhost:3001",
 *   "testnet"
 * )
 *
 * const response = await client.registerUser(...)
 * ```
 */
export function createGiverClient(
  apiUrl: string,
  network: "testnet" | "mainnet"
): GiverClient {
  return new GiverClient({ apiUrl, network })
}
