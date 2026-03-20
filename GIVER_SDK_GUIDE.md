# Giver SDK Integration Guide

Complete TypeScript integration SDK for the Giver Rust service that facilitates cross-chain USDC transfers from Ethereum to Stacks.

## Files Created

### Core SDK Files

1. **`lib/giver-sdk.ts`** (292 lines)
   - Main GiverClient class with strict TypeScript types
   - Methods: `registerUser()`, `lookupUser()`, `checkHealth()`
   - Response types: `RegisterResponse`, `LookupResponse`, `HealthResponse`
   - Error handling with `GiverError` class
   - Factory function: `createGiverClient()`
   - 30-second request timeout
   - Complete JSDoc documentation

2. **`lib/giver-api.ts`** (375 lines)
   - Next.js API route handlers for GET and POST
   - Handles registration, lookup, and health check endpoints
   - Full error handling with HTTP status codes
   - Environment variable support (NEXT_PUBLIC_GIVER_API_URL)
   - Input validation and type safety
   - Consistent error response formatting

3. **`app/api/giver/route.ts`** (8 lines)
   - Next.js 16 API route file
   - Re-exports GET and POST handlers from lib/giver-api.ts
   - Follows Next.js App Router conventions

4. **`lib/giver-sdk.usage.ts`** (292 lines)
   - Comprehensive usage documentation
   - Code examples for all SDK methods
   - API route usage examples
   - Error handling patterns
   - Testing examples
   - Troubleshooting guide

5. **`.env.example`** (10 lines)
   - Environment variable template
   - NEXT_PUBLIC_GIVER_API_URL configuration
   - Server-side fallback option

## Features

### Type Safety

- ✅ TypeScript strict mode enabled
- ✅ Zero `any` types
- ✅ Complete JSDoc comments
- ✅ Proper error type definitions
- ✅ Type-safe response handling

### Error Handling

- ✅ `GiverError` class with error codes
- ✅ Network error detection
- ✅ Timeout handling (30 seconds)
- ✅ HTTP status code mapping
- ✅ Meaningful error messages

### Features

- ✅ User registration with signature verification
- ✅ User lookup by Ethereum or Stacks address
- ✅ Service health checks
- ✅ Request/response validation
- ✅ Environment variable configuration

### Architecture

- ✅ Fetch API (native, no external dependencies)
- ✅ Next.js 16 compatible
- ✅ Server and client-side support
- ✅ API route handlers included
- ✅ No external dependencies required

## Quick Start

### 1. Set Environment Variable

Create or update `.env.local`:

```bash
NEXT_PUBLIC_GIVER_API_URL=http://localhost:3001
```

### 2. Use in Client Code

```typescript
import { createGiverClient } from "@/lib/giver-sdk"

const giverClient = createGiverClient(
  process.env.NEXT_PUBLIC_GIVER_API_URL!,
  "testnet"
)

// Register user
const response = await giverClient.registerUser(
  "0x1234567890abcdef1234567890abcdef12345678",
  "SP1234567890ABCDEF1234567890ABCDEF1234567890",
  "0xabcd...", // signature
  "Register me on the bridge" // message
)

// Lookup user
const lookup = await giverClient.lookupUser("0x1234...")

// Check health
const health = await giverClient.checkHealth()
```

### 3. Use via Next.js API Routes

```typescript
// POST /api/giver (register)
const response = await fetch("/api/giver?action=register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    eth_address: "0x1234...",
    stacks_address: "SP1234...",
    signature: "0xabcd...",
    message: "Register me",
  }),
})

// GET /api/giver (lookup)
const lookup = await fetch("/api/giver?action=lookup&eth_address=0x1234...")

// GET /api/giver (health)
const health = await fetch("/api/giver?action=health")
```

## API Methods

### GiverClient.registerUser()

Register a user by mapping Ethereum address to Stacks address.

```typescript
async registerUser(
  ethAddress: string,
  stacksAddress: string,
  signature: string,
  message: string
): Promise<RegisterResponse>
```

**Parameters:**

- `ethAddress` - Ethereum address (0x-prefixed hex)
- `stacksAddress` - Stacks address (SP or ST prefix)
- `signature` - EIP-191 signed message (65 bytes, 0x-prefixed hex)
- `message` - Original message that was signed

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  user_id?: number,
  eth_address?: string,
  stacks_address?: string
}
```

### GiverClient.lookupUser()

Look up a user by their Ethereum or Stacks address.

```typescript
async lookupUser(
  ethAddress?: string,
  stacksAddress?: string
): Promise<LookupResponse>
```

**Parameters:**

- `ethAddress` - Ethereum address (optional)
- `stacksAddress` - Stacks address (optional)
  - At least one must be provided

**Returns:**

```typescript
{
  found: boolean,
  eth_address?: string,
  stacks_address?: string
}
```

### GiverClient.checkHealth()

Check if the Giver service is healthy.

```typescript
async checkHealth(): Promise<HealthResponse>
```

**Returns:**

```typescript
{
  status: "ok" | "error",
  timestamp?: string
}
```

## Error Handling

All SDK methods throw `GiverError` on failure:

```typescript
import { GiverClient, GiverError } from "@/lib/giver-sdk"

try {
  const response = await giverClient.registerUser(...)
} catch (error) {
  if (error instanceof GiverError) {
    switch (error.code) {
      case "TIMEOUT":
        console.error("Request timed out")
        break
      case "NETWORK_ERROR":
        console.error("Network failed:", error.originalError)
        break
      case "HTTP_400":
        console.error("Invalid request")
        break
      case "HTTP_500":
        console.error("Server error")
        break
      default:
        console.error("Error:", error.code)
    }
  }
}
```

**Error Codes:**

- `TIMEOUT` - Request exceeded 30 seconds
- `NETWORK_ERROR` - Network connection failed
- `INVALID_INPUT` - Invalid input parameters
- `HTTP_XXX` - HTTP error response (XXX = status code)
- `UNKNOWN_ERROR` - Unknown error

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_GIVER_API_URL=http://localhost:3001

# Alternative (server-side only)
GIVER_API_URL=http://localhost:3001
```

### Network Selection

When creating a client, specify the network:

```typescript
const testnetClient = createGiverClient(apiUrl, "testnet")
const mainnetClient = createGiverClient(apiUrl, "mainnet")
```

## Type Definitions

All types are exported from `lib/giver-sdk.ts`:

```typescript
// Configuration
export interface GiverConfig {
  apiUrl: string
  network: "testnet" | "mainnet"
}

// Responses
export interface RegisterResponse { ... }
export interface LookupResponse { ... }
export interface HealthResponse { ... }

// Client and factory
export class GiverClient { ... }
export class GiverError extends Error { ... }
export function createGiverClient(...): GiverClient { ... }
```

## Integration Examples

### Register User from Component

```typescript
"use client"

import { useState } from "react"
import { createGiverClient } from "@/lib/giver-sdk"

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (
    ethAddress: string,
    stacksAddress: string,
    signature: string,
    message: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      const client = createGiverClient(
        process.env.NEXT_PUBLIC_GIVER_API_URL!,
        "testnet"
      )

      const response = await client.registerUser(
        ethAddress,
        stacksAddress,
        signature,
        message
      )

      if (response.success) {
        console.log("Registered user:", response.user_id)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {/* Form UI */}
    </div>
  )
}
```

### Custom Hook

```typescript
import { useCallback, useState } from "react"
import { createGiverClient, type RegisterResponse } from "@/lib/giver-sdk"

export function useGiver() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const client = createGiverClient(
    process.env.NEXT_PUBLIC_GIVER_API_URL!,
    "testnet"
  )

  const register = useCallback(
    async (
      ethAddress: string,
      stacksAddress: string,
      signature: string,
      message: string
    ): Promise<RegisterResponse | null> => {
      try {
        setLoading(true)
        setError(null)
        return await client.registerUser(
          ethAddress,
          stacksAddress,
          signature,
          message
        )
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  const lookup = useCallback(
    async (ethAddress?: string, stacksAddress?: string) => {
      try {
        setLoading(true)
        setError(null)
        return await client.lookupUser(ethAddress, stacksAddress)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        return null
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  return { register, lookup, loading, error }
}
```

## Testing

```typescript
import { createGiverClient } from "@/lib/giver-sdk"

describe("GiverClient", () => {
  const client = createGiverClient("http://localhost:3001", "testnet")

  test("registers a user", async () => {
    const response = await client.registerUser(
      "0x1234567890abcdef1234567890abcdef12345678",
      "SP1234567890ABCDEF1234567890ABCDEF1234567890",
      "0x" + "a".repeat(130), // 65 bytes
      "test message"
    )
    expect(response.success).toBe(true)
    expect(response.user_id).toBeDefined()
  })

  test("lookups user by address", async () => {
    const response = await client.lookupUser(
      "0x1234567890abcdef1234567890abcdef12345678"
    )
    expect(response.found).toBe(true)
  })

  test("checks service health", async () => {
    const response = await client.checkHealth()
    expect(response.status).toBe("ok")
  })

  test("handles timeout errors", async () => {
    const client = createGiverClient("http://invalid.local", "testnet")
    await expect(client.checkHealth()).rejects.toThrow()
  })
})
```

## Production Deployment

### Environment Setup

```bash
# .env.production
NEXT_PUBLIC_GIVER_API_URL=https://giver.example.com
```

### Security Considerations

1. **HTTPS Only**: Ensure Giver service uses HTTPS in production
2. **Rate Limiting**: Consider rate limiting on API routes
3. **CORS**: Configure appropriate CORS headers
4. **Input Validation**: All inputs are validated server and client-side
5. **Signature Verification**: Always verify signatures on server

### Performance

- Requests timeout after 30 seconds
- Consider caching lookup results
- Implement request batching if needed
- Monitor Giver service health

## Troubleshooting

### Connection Refused

```bash
# Verify Giver service is running
curl http://localhost:3001/health

# Check environment variable
echo $NEXT_PUBLIC_GIVER_API_URL
```

### Timeout Errors

- Giver service is slow or offline
- Network connectivity issue
- Consider retrying with exponential backoff

### Invalid Signature

- Ensure signature is properly formatted (65 bytes, 0x-prefixed)
- Verify message matches what was signed
- Check Ethereum address is correct

### Type Errors

- Ensure TypeScript strict mode is enabled
- All types are exported from `lib/giver-sdk.ts`
- Use `import type { ... }` for type-only imports

## File Structure

```
lib/
├── giver-sdk.ts              # Main SDK implementation
├── giver-api.ts              # Next.js API handlers
└── giver-sdk.usage.ts        # Usage documentation

app/api/giver/
└── route.ts                  # API route handler

.env.example                  # Environment template
```

## Version Info

- **TypeScript**: ^5
- **Next.js**: 16.1.4
- **Node**: >= 18
- **Runtime**: Node.js, Edge (compatible)

## Related Documentation

- See `lib/giver-sdk.usage.ts` for detailed usage examples
- See `AGENTS.md` for Builder-X development guidelines
- Giver Rust service docs: See main project README

## Support

For issues or questions:

- Check the troubleshooting section above
- Review code examples in `lib/giver-sdk.usage.ts`
- Check Giver service logs
- Verify environment configuration
