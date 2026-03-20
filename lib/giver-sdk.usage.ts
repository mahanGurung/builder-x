/**
 * Giver SDK Usage Guide
 *
 * The Giver SDK provides TypeScript integration for the Giver Rust service,
 * enabling cross-chain USDC transfers from Ethereum to Stacks.
 *
 * ## Setup
 *
 * 1. Install the SDK (already included in this project)
 * 2. Set environment variable: NEXT_PUBLIC_GIVER_API_URL=http://localhost:3001
 * 3. Import and create a client instance
 *
 * ## Client Usage
 *
 * ### Basic Setup
 *
 * ```typescript
 * import { createGiverClient } from "@/lib/giver-sdk"
 *
 * const giverClient = createGiverClient(
 *   process.env.NEXT_PUBLIC_GIVER_API_URL || "http://localhost:3001",
 *   "testnet" // or "mainnet"
 * )
 * ```
 *
 * ### Registering a User
 *
 * Register a mapping between an Ethereum address and Stacks address:
 *
 * ```typescript
 * try {
 *   const response = await giverClient.registerUser(
 *     "0x1234567890abcdef1234567890abcdef12345678", // Ethereum address
 *     "SP1234567890ABCDEF1234567890ABCDEF1234567890", // Stacks address
 *     "0xabcd...", // Signed message (65 bytes hex)
 *     "Register me on the bridge" // Original message
 *   )
 *
 *   if (response.success) {
 *     console.log("User registered:", response.user_id)
 *   }
 * } catch (error) {
 *   console.error("Registration failed:", error)
 * }
 * ```
 *
 * ### Looking Up a User
 *
 * Look up user address mapping by Ethereum or Stacks address:
 *
 * ```typescript
 * // Lookup by Ethereum address
 * const result = await giverClient.lookupUser(
 *   "0x1234567890abcdef1234567890abcdef12345678"
 * )
 *
 * // Lookup by Stacks address
 * const result = await giverClient.lookupUser(
 *   undefined,
 *   "SP1234567890ABCDEF1234567890ABCDEF1234567890"
 * )
 *
 * if (result.found) {
 *   console.log("Ethereum:", result.eth_address)
 *   console.log("Stacks:", result.stacks_address)
 * }
 * ```
 *
 * ### Checking Health
 *
 * Check if the Giver service is healthy:
 *
 * ```typescript
 * const health = await giverClient.checkHealth()
 *
 * if (health.status === "ok") {
 *   console.log("Service is healthy")
 * }
 * ```
 *
 * ## API Routes Usage
 *
 * ### POST /api/giver?action=register
 *
 * Register a user through the Next.js API:
 *
 * ```typescript
 * const response = await fetch("/api/giver?action=register", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     eth_address: "0x1234...",
 *     stacks_address: "SP1234...",
 *     signature: "0xabcd...",
 *     message: "Register me"
 *   })
 * })
 *
 * const data = await response.json()
 * ```
 *
 * ### GET /api/giver?action=lookup&eth_address=0x1234...
 *
 * Lookup a user through the Next.js API:
 *
 * ```typescript
 * const response = await fetch(
 *   "/api/giver?action=lookup&eth_address=0x1234..."
 * )
 *
 * const data = await response.json()
 * ```
 *
 * ### GET /api/giver?action=health
 *
 * Check service health through the Next.js API:
 *
 * ```typescript
 * const response = await fetch("/api/giver?action=health")
 * const health = await response.json()
 * ```
 *
 * ## Error Handling
 *
 * The SDK throws `GiverError` exceptions with specific error codes:
 *
 * ```typescript
 * import { GiverClient, GiverError } from "@/lib/giver-sdk"
 *
 * try {
 *   await giverClient.registerUser(...)
 * } catch (error) {
 *   if (error instanceof GiverError) {
 *     switch (error.code) {
 *       case "TIMEOUT":
 *         console.error("Request timed out after 30 seconds")
 *         break
 *       case "NETWORK_ERROR":
 *         console.error("Network connection failed")
 *         break
 *       case "HTTP_400":
 *         console.error("Invalid request")
 *         break
 *       case "HTTP_500":
 *         console.error("Server error")
 *         break
 *       default:
 *         console.error("Error:", error.code, error.message)
 *     }
 *   }
 * }
 * ```
 *
 * ## Environment Variables
 *
 * Required for client-side and server-side:
 * - `NEXT_PUBLIC_GIVER_API_URL` - Base URL of Giver service (e.g., http://localhost:3001)
 *
 * Optional for server-side only:
 * - `GIVER_API_URL` - Will be used if `NEXT_PUBLIC_GIVER_API_URL` is not set
 *
 * ## Type Definitions
 *
 * All types are strictly typed with TypeScript strict mode enabled:
 *
 * ```typescript
 * // Request types (passed to methods)
 * interface GiverConfig {
 *   apiUrl: string
 *   network: "testnet" | "mainnet"
 * }
 *
 * // Response types
 * interface RegisterResponse {
 *   success: boolean
 *   message: string
 *   user_id?: number
 *   eth_address?: string
 *   stacks_address?: string
 * }
 *
 * interface LookupResponse {
 *   found: boolean
 *   eth_address?: string
 *   stacks_address?: string
 * }
 *
 * interface HealthResponse {
 *   status: "ok" | "error"
 *   timestamp?: string
 * }
 * ```
 *
 * ## Timeout Handling
 *
 * All requests have a 30-second timeout. If a request takes longer:
 *
 * ```typescript
 * try {
 *   const response = await giverClient.lookupUser(ethAddress)
 * } catch (error) {
 *   if (error instanceof GiverError && error.code === "TIMEOUT") {
 *     // Handle timeout - show user a message or retry
 *   }
 * }
 * ```
 *
 * ## Security Considerations
 *
 * 1. **Signatures**: Always require user signatures for registration to prove address ownership
 * 2. **HTTPS**: Use HTTPS in production (wss:// for WebSockets)
 * 3. **Rate Limiting**: Consider implementing rate limiting on API routes
 * 4. **Validation**: All inputs are validated on both client and server
 * 5. **CORS**: Configure CORS headers appropriately for your environment
 *
 * ## Testing
 *
 * Example test setup:
 *
 * ```typescript
 * import { createGiverClient } from "@/lib/giver-sdk"
 *
 * describe("GiverClient", () => {
 *   const client = createGiverClient("http://localhost:3001", "testnet")
 *
 *   it("should register a user", async () => {
 *     const response = await client.registerUser(
 *       "0x1234...",
 *       "SP1234...",
 *       "0xabcd...",
 *       "test"
 *     )
 *     expect(response.success).toBe(true)
 *   })
 *
 *   it("should lookup a user", async () => {
 *     const response = await client.lookupUser("0x1234...")
 *     expect(response.found).toBe(true)
 *   })
 *
 *   it("should check health", async () => {
 *     const response = await client.checkHealth()
 *     expect(response.status).toBe("ok")
 *   })
 * })
 * ```
 *
 * ## Architecture
 *
 * ```
 * Client Code
 *     ↓
 * GiverClient (lib/giver-sdk.ts)
 *     ↓
 * fetch() → Giver Service (http://localhost:3001)
 *
 * Or via Next.js:
 *
 * Client Code
 *     ↓
 * API Routes (app/api/giver/route.ts)
 *     ↓
 * GiverClient (lib/giver-sdk.ts)
 *     ↓
 * fetch() → Giver Service (http://localhost:3001)
 * ```
 *
 * ## Troubleshooting
 *
 * ### Connection Refused
 * - Ensure Giver service is running on the correct port
 * - Check `NEXT_PUBLIC_GIVER_API_URL` is correct
 * - Try `curl http://localhost:3001/health` to verify connection
 *
 * ### Invalid Signature
 * - Ensure signature is properly formatted (65 bytes, 0x-prefixed)
 * - Verify the message matches what was signed
 * - Check the Ethereum address is correct
 *
 * ### Timeout Errors
 * - Network is slow or Giver service is overloaded
 * - Consider increasing timeout (modify SDK) or retrying
 * - Check server logs for performance issues
 */

export {}
