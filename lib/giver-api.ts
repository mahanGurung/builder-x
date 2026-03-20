/**
 * Giver API - Next.js API route handlers
 * Provides endpoints for registering and looking up users on the Giver service
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  createGiverClient,
  type GiverError,
  type HealthResponse,
  type LookupResponse,
  type RegisterResponse,
  type VaultState,
} from "@/lib/giver-sdk"

/**
 * Get the Giver API URL from environment variables
 * Falls back to localhost for development
 */
function getGiverApiUrl(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_GIVER_API_URL ||
    process.env.GIVER_API_URL ||
    "http://localhost:3001"

  if (!apiUrl) {
    throw new Error("GIVER_API_URL environment variable is not set")
  }

  return apiUrl
}

/**
 * Format error responses consistently
 */
function formatErrorResponse(
  error: unknown,
  defaultMessage: string
): {
  success: false
  message: string
  error?: string
} {
  if (error instanceof Error) {
    const giverError = error as unknown as GiverError & Error
    return {
      success: false,
      message: defaultMessage,
      error: giverError.message || error.message,
    }
  }

  return {
    success: false,
    message: defaultMessage,
    error: String(error),
  }
}

/**
 * POST /api/giver/register
 * Register a user by mapping Ethereum address to Stacks address
 *
 * Request body:
 * ```json
 * {
 *   "eth_address": "0x1234...",
 *   "stacks_address": "SP1234...",
 *   "signature": "0xabcd...",
 *   "message": "Register me on the bridge"
 * }
 * ```
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "user_id": 123,
 *   "eth_address": "0x1234...",
 *   "stacks_address": "SP1234..."
 * }
 * ```
 *
 * Error response (400 or 500):
 * ```json
 * {
 *   "success": false,
 *   "message": "Failed to register user",
 *   "error": "Error details"
 * }
 * ```
 */
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      action?: string
    }>
  }
): Promise<NextResponse> {
  try {
    const params = await context.params
    const action = params.action

    if (action === "register") {
      return await handleRegister(request)
    }

    if (action === "lookup") {
      return await handleLookup(request)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unknown action",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("Giver API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for lookup endpoint
 */
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      action?: string
    }>
  }
): Promise<NextResponse> {
  try {
    const params = await context.params
    const action = params.action

    if (action === "lookup") {
      return await handleLookup(request)
    }

    if (action === "health") {
      return await handleHealth(request)
    }

    if (action === "vaultState") {
      return await handleVaultState(request)
    }

    if (action === "vaultBalance") {
      return await handleActualBalance(request)
    }

    if (action === "isVaultPaused") {
      return await handleVaultPauseStatus(request)
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unknown action",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("Giver API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Handle user registration request
 */
async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as unknown

    // Validate request body
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        { status: 400 }
      )
    }

    const {
      eth_address: ethAddress,
      stacks_address: stacksAddress,
      signature,
      message,
    } = body as Record<string, unknown>

    // Validate required fields
    if (
      !ethAddress ||
      !stacksAddress ||
      !signature ||
      !message ||
      typeof ethAddress !== "string" ||
      typeof stacksAddress !== "string" ||
      typeof signature !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing or invalid required fields: eth_address, stacks_address, signature, message",
        },
        { status: 400 }
      )
    }

    // Create Giver client and register user
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const response = await giverClient.registerUser(
      ethAddress,
      stacksAddress,
      signature,
      message
    )

    // Return success response
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Registration error:", error)

    // Handle specific error types
    if (error instanceof Error && "code" in error) {
      const giverError = error as GiverError & Error

      // Map error codes to HTTP status codes
      if (
        giverError.code === "HTTP_400" ||
        giverError.code === "INVALID_INPUT"
      ) {
        return NextResponse.json(
          formatErrorResponse(error, "Invalid registration request"),
          { status: 400 }
        )
      }

      if (giverError.code === "TIMEOUT") {
        return NextResponse.json(
          formatErrorResponse(error, "Request timeout"),
          { status: 504 }
        )
      }

      if (giverError.code.startsWith("HTTP_")) {
        const statusCode = parseInt(giverError.code.replace("HTTP_", ""), 10)
        return NextResponse.json(
          formatErrorResponse(error, "Registration failed"),
          { status: statusCode }
        )
      }
    }

    return NextResponse.json(
      formatErrorResponse(error, "Failed to register user"),
      { status: 500 }
    )
  }
}

/**
 * Handle user lookup request
 */
async function handleLookup(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)

    // Get optional address parameters
    const ethAddress = searchParams.get("eth_address")
    const stacksAddress = searchParams.get("stacks_address")

    // Validate at least one address is provided
    if (!ethAddress && !stacksAddress) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one address parameter is required: eth_address or stacks_address",
        },
        { status: 400 }
      )
    }

    // Create Giver client and lookup user
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const response = await giverClient.lookupUser(
      ethAddress || undefined,
      stacksAddress || undefined
    )

    // Return lookup response
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Lookup error:", error)

    // Handle specific error types
    if (error instanceof Error && "code" in error) {
      const giverError = error as GiverError & Error

      if (giverError.code === "TIMEOUT") {
        return NextResponse.json(
          formatErrorResponse(error, "Request timeout"),
          { status: 504 }
        )
      }

      if (giverError.code.startsWith("HTTP_")) {
        const statusCode = parseInt(giverError.code.replace("HTTP_", ""), 10)
        return NextResponse.json(
          formatErrorResponse(error, "Lookup failed"),
          { status: statusCode }
        )
      }
    }

    return NextResponse.json(
      formatErrorResponse(error, "Failed to lookup user"),
      { status: 500 }
    )
  }
}

/**
 * Handle health check request
 */
async function handleHealth(request: NextRequest): Promise<NextResponse> {
  try {
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const response = await giverClient.checkHealth()

    if (response.status === "ok") {
      return NextResponse.json(response, { status: 200 })
    }

    return NextResponse.json(response, { status: 503 })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } as HealthResponse & { error?: string },
      { status: 503 }
    )
  }
}

/**
 * Handle vault state request
 * Returns complete vault state: balance, actual balance, reward balance, and pause status
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "vaultBalance": "1000000000",
 *     "actualBalance": "1000000000",
 *     "rewardBalance": "4000000",
 *     "isPaused": false
 *   }
 * }
 * ```
 */
async function handleVaultState(request: NextRequest): Promise<NextResponse> {
  try {
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const vaultState = await giverClient.getVaultState()

    return NextResponse.json(
      {
        success: true,
        data: {
          vaultBalance: vaultState.vaultBalance.toString(),
          actualBalance: vaultState.actualBalance.toString(),
          rewardBalance: vaultState.rewardBalance.toString(),
          isPaused: vaultState.isPaused,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Vault state error:", error)

    const statusCode =
      error instanceof Error && "code" in error
        ? (error as GiverError & Error).code === "TIMEOUT"
          ? 504
          : 500
        : 500

    return NextResponse.json(
      formatErrorResponse(error, "Failed to retrieve vault state"),
      { status: statusCode }
    )
  }
}

/**
 * Handle actual balance request
 * Returns the real USDCx balance in the vault
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "balance": "1000000000"
 * }
 * ```
 */
async function handleActualBalance(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const balance = await giverClient.getActualBalance()

    return NextResponse.json(
      {
        success: true,
        balance: balance.toString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Actual balance error:", error)

    const statusCode =
      error instanceof Error && "code" in error
        ? (error as GiverError & Error).code === "TIMEOUT"
          ? 504
          : 500
        : 500

    return NextResponse.json(
      formatErrorResponse(error, "Failed to retrieve actual balance"),
      { status: statusCode }
    )
  }
}

/**
 * Handle vault pause status request
 * Returns whether the vault is currently paused
 *
 * Success response (200):
 * ```json
 * {
 *   "success": true,
 *   "isPaused": false
 * }
 * ```
 */
async function handleVaultPauseStatus(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const giverClient = createGiverClient(
      getGiverApiUrl(),
      "testnet" // TODO: make this configurable
    )

    const isPaused = await giverClient.isVaultPaused()

    return NextResponse.json(
      {
        success: true,
        isPaused,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Vault pause status error:", error)

    const statusCode =
      error instanceof Error && "code" in error
        ? (error as GiverError & Error).code === "TIMEOUT"
          ? 504
          : 500
        : 500

    return NextResponse.json(
      formatErrorResponse(error, "Failed to retrieve vault pause status"),
      { status: statusCode }
    )
  }
}
