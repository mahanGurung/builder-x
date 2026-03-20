/**
 * Example integration test for the Giver SDK
 * Demonstrates how to use the SDK in your application
 */

import {
  createGiverClient,
  GiverClient,
  GiverError,
  type HealthResponse,
  type LookupResponse,
  type RegisterResponse,
} from "@/lib/giver-sdk"

/**
 * Example: Basic SDK usage
 */
async function exampleBasicUsage() {
  const client = createGiverClient(
    process.env.NEXT_PUBLIC_GIVER_API_URL || "http://localhost:3001",
    "testnet"
  )

  try {
    // Check service health
    const health = await client.checkHealth()
    console.log("Service health:", health.status)

    // Register user
    const registerResponse = await client.registerUser(
      "0x1234567890abcdef1234567890abcdef12345678",
      "SP1234567890ABCDEF1234567890ABCDEF1234567890",
      "0xabcd1234...", // signature
      "Register me"
    )
    console.log("Registered:", registerResponse.user_id)

    // Lookup user
    const lookupResponse = await client.lookupUser(
      "0x1234567890abcdef1234567890abcdef12345678"
    )
    console.log("Found user:", lookupResponse.found)
  } catch (error) {
    if (error instanceof GiverError) {
      console.error("Giver error:", error.code, error.message)
    } else {
      console.error("Unknown error:", error)
    }
  }
}

/**
 * Example: Error handling
 */
async function exampleErrorHandling() {
  const client = createGiverClient("http://localhost:3001", "testnet")

  try {
    // This will timeout if service is not responding
    await client.checkHealth()
  } catch (error) {
    if (error instanceof GiverError) {
      switch (error.code) {
        case "TIMEOUT":
          console.error("Service is slow or not responding")
          break
        case "NETWORK_ERROR":
          console.error("Network error:", error.originalError?.message)
          break
        case "HTTP_400":
          console.error("Invalid request")
          break
        case "HTTP_500":
          console.error("Server error")
          break
        default:
          console.error("Unexpected error:", error.code)
      }
    }
  }
}

/**
 * Example: API route usage (from Next.js client component)
 */
async function exampleApiRouteUsage() {
  try {
    // Register via API route
    const registerResponse = await fetch("/api/giver?action=register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eth_address: "0x1234567890abcdef1234567890abcdef12345678",
        stacks_address: "SP1234567890ABCDEF1234567890ABCDEF1234567890",
        signature: "0xabcd1234...",
        message: "Register me",
      }),
    })

    if (!registerResponse.ok) {
      throw new Error(
        `HTTP ${registerResponse.status}: ${await registerResponse.text()}`
      )
    }

    const data = (await registerResponse.json()) as RegisterResponse
    console.log("Registered:", data.user_id)

    // Lookup via API route
    const lookupResponse = await fetch(
      "/api/giver?action=lookup&eth_address=0x1234567890abcdef1234567890abcdef12345678"
    )

    const lookupData = (await lookupResponse.json()) as LookupResponse
    console.log("Found:", lookupData.found)

    // Health check via API route
    const healthResponse = await fetch("/api/giver?action=health")
    const healthData = (await healthResponse.json()) as HealthResponse
    console.log("Service status:", healthData.status)
  } catch (error) {
    console.error("API route error:", error)
  }
}

/**
 * Example: Type-safe usage with explicit types
 */
async function exampleTypeSafeUsage() {
  const client: GiverClient = createGiverClient(
    "http://localhost:3001",
    "testnet"
  )

  // Type-safe response handling
  const response: RegisterResponse = await client.registerUser(
    "0x1234567890abcdef1234567890abcdef12345678",
    "SP1234567890ABCDEF1234567890ABCDEF1234567890",
    "0xabcd1234...",
    "Register"
  )

  if (response.success && response.user_id) {
    console.log("User ID:", response.user_id) // TypeScript knows user_id exists
  }

  // Type-safe lookup
  const lookupResult: LookupResponse = await client.lookupUser(
    "0x1234567890abcdef1234567890abcdef12345678"
  )

  if (lookupResult.found) {
    console.log("Stacks address:", lookupResult.stacks_address) // TypeScript knows this exists
  }

  // Type-safe health check
  const health: HealthResponse = await client.checkHealth()
  console.log("Status:", health.status) // "ok" | "error"
}

/**
 * Example: Custom configuration
 */
function exampleCustomConfiguration() {
  // Development
  const devClient = createGiverClient("http://localhost:3001", "testnet")

  // Production
  const prodClient = createGiverClient(
    "https://giver.example.com",
    "mainnet"
  )

  // Environment-based
  const apiUrl = process.env.NEXT_PUBLIC_GIVER_API_URL || "http://localhost:3001"
  const network = (process.env.GIVER_NETWORK as "testnet" | "mainnet") || "testnet"
  const envClient = createGiverClient(apiUrl, network)

  return { devClient, prodClient, envClient }
}

/**
 * Example: Request timeout handling
 */
async function exampleTimeoutHandling() {
  const client = createGiverClient("http://slow-service.invalid", "testnet")

  try {
    // This will timeout after 30 seconds
    await client.checkHealth()
  } catch (error) {
    if (error instanceof GiverError && error.code === "TIMEOUT") {
      console.log("Request timed out after 30 seconds")
      console.log("You might want to:")
      console.log("1. Retry with exponential backoff")
      console.log("2. Show user a timeout message")
      console.log("3. Check service status")
    }
  }
}

/**
 * Example: Retry logic
 */
async function exampleRetryLogic() {
  const client = createGiverClient("http://localhost:3001", "testnet")

  async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.log(`Attempt ${i + 1} failed, retrying...`)
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }

    throw lastError
  }

  try {
    const health = await withRetry(() => client.checkHealth())
    console.log("Health check succeeded:", health.status)
  } catch (error) {
    console.error("All retry attempts failed:", error)
  }
}

// Type exports for testing
export type { GiverClient, GiverError }
export { exampleBasicUsage, exampleErrorHandling, exampleApiRouteUsage }
