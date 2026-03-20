# Giver Registration Components & Hook Documentation

This document covers the custom React hook and UI components for Giver bridge registration with wallet integration.

## Overview

The Giver registration system provides:

- **Custom Hook**: `useGiverRegistration` - Manages registration state and API interactions
- **Form Component**: `GiverRegistrationForm` - Complete registration UI with wallet integration
- **Type-safe**: Full TypeScript support with proper error handling
- **Wallet Integration**: Ethereum wallet connection with message signing
- **Address Validation**: Real-time Stacks and Ethereum address validation
- **User Lookup**: Check existing registrations by address

## Custom Hook: `useGiverRegistration`

### Location

`/hooks/use-giver-registration.ts`

### Type Definition

```typescript
export interface UseGiverRegistrationReturn {
  isLoading: boolean
  isRegistered: boolean
  error: string | null
  registerUser: (
    ethAddress: string,
    stacksAddress: string,
    signature: string,
    message: string
  ) => Promise<RegisterResponse | null>
  lookupUser: (address: string, type: "eth" | "stacks") => Promise<boolean>
  clearError: () => void
}
```

### Usage Example

```typescript
"use client"

import { useGiverRegistration } from "@/hooks/use-giver-registration"

export function MyComponent() {
  const { isLoading, error, registerUser, clearError } = useGiverRegistration()

  const handleRegister = async () => {
    try {
      const response = await registerUser(
        "0x1234567890abcdef1234567890abcdef12345678",
        "ST1234567890ABCDEF1234567890ABCDEF1234567890",
        "0xsignature...",
        "I own ST1234567890ABCDEF1234567890ABCDEF1234567890 on Stacks"
      )

      if (response) {
        console.log("User registered with ID:", response.user_id)
      }
    } catch (err) {
      console.error("Registration failed:", error)
    }
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? "Registering..." : "Register"}
      </button>
    </div>
  )
}
```

### Hook Methods

#### `registerUser(ethAddress, stacksAddress, signature, message)`

Registers a user by mapping Ethereum address to Stacks address.

**Parameters:**

- `ethAddress` (string): Ethereum address (0x-prefixed hex)
- `stacksAddress` (string): Stacks address (ST-prefixed)
- `signature` (string): Signed message (65 bytes, 0x-prefixed hex)
- `message` (string): Original message that was signed

**Returns:** `Promise<RegisterResponse | null>`

**Example:**

```typescript
const response = await registerUser(
  "0x1234567890abcdef1234567890abcdef12345678",
  "ST1234567890ABCDEF1234567890ABCDEF1234567890",
  "0xabcd...",
  "I own ST1234567890ABCDEF1234567890ABCDEF1234567890 on Stacks"
)

if (response?.success) {
  console.log("Registered with user_id:", response.user_id)
}
```

#### `lookupUser(address, type)`

Looks up a user by their Ethereum or Stacks address.

**Parameters:**

- `address` (string): Address to lookup
- `type` ("eth" | "stacks"): Type of address

**Returns:** `Promise<boolean>` - Whether user was found

**Example:**

```typescript
const found = await lookupUser(
  "0x1234567890abcdef1234567890abcdef12345678",
  "eth"
)
if (found) {
  console.log("User found in registration database")
}
```

#### `clearError()`

Clears the current error state.

**Example:**

```typescript
clearError()
```

### State Properties

- **isLoading**: Boolean indicating if an async operation is in progress
- **isRegistered**: Boolean indicating if the user is registered
- **error**: Error message (string) or null if no error

## Form Component: `GiverRegistrationForm`

### Location

`/components/bridge/giver-registration-form.tsx`

### Type Definition

```typescript
export interface GiverRegistrationFormProps {
  onRegistrationSuccess?: (userId: number) => void
  onRegistrationError?: (error: string) => void
}
```

### Features

✅ **Ethereum Address Display**

- Shows connected Ethereum address (read-only)
- Connection status badge
- Visual indication when wallet is connected

✅ **Stacks Address Input**

- Real-time validation
- Format checking (must start with ST, be 34 characters)
- Visual feedback (green for valid, red for invalid)
- Helpful error messages

✅ **Message Preview**

- Shows the exact message user will sign
- Format: `"I own {stacksAddress} on Stacks"`
- Helps user understand what they're signing

✅ **Wallet Integration**

- Uses `useDualWallet` hook for wallet connection
- Integrates with MetaMask for message signing
- Secure signing flow with clear prompts

✅ **Registration Workflow**

- Validates input before allowing signing
- Requests user signature from connected wallet
- Sends registration to Giver service
- Shows success/error feedback

✅ **User Lookup**

- Check if user already registered
- Lookup by Ethereum address (0x prefix)
- Lookup by Stacks address (ST prefix)
- Clear feedback on lookup results

✅ **Error Handling**

- Displays error messages with close button
- Clears errors when needed
- Handles wallet errors gracefully

### Usage Example

```typescript
"use client"

import { GiverRegistrationForm } from "@/components/bridge/giver-registration-form"

export function RegistrationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <GiverRegistrationForm
        onRegistrationSuccess={(userId) => {
          console.log("Registration successful! User ID:", userId)
          // Redirect or show success message
        }}
        onRegistrationError={(error) => {
          console.error("Registration failed:", error)
          // Handle error
        }}
      />
    </div>
  )
}
```

### Props

**onRegistrationSuccess** (optional)

- Type: `(userId: number) => void`
- Called when registration completes successfully
- Receives the user ID from the service

**onRegistrationError** (optional)

- Type: `(error: string) => void`
- Called when registration or signing fails
- Receives the error message

### UI Elements

The form includes:

- **Card Container**: Organized with header and content sections
- **Ethereum Address Field**: Read-only input with connection status
- **Stacks Address Field**: Validated input with real-time feedback
- **Message Preview**: Shows the message that will be signed
- **Sign Button**: Primary action to sign and register
- **Check Registration Button**: Toggle for user lookup section
- **Error Display**: Dismissible error messages with icons
- **Success Message**: Confirmation when registration succeeds
- **Signature Status**: Shows the signature that was created
- **Lookup Section**: Toggle section to check existing registrations

## Integration Guide

### Step 1: Setup Environment Variables

```bash
# .env.local or your environment file
NEXT_PUBLIC_GIVER_API_URL=http://localhost:3001
```

### Step 2: Add Component to Page

```typescript
// app/register/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { GiverRegistrationForm } from "@/components/bridge/giver-registration-form"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <GiverRegistrationForm
        onRegistrationSuccess={(userId) => {
          // Navigate to success page or home
          router.push("/bridge")
        }}
        onRegistrationError={(error) => {
          // Show error toast or handle
          console.error("Registration error:", error)
        }}
      />
    </div>
  )
}
```

### Step 3: Use Hook Independently

```typescript
// For custom implementations
"use client"

import { useGiverRegistration } from "@/hooks/use-giver-registration"
import { useDualWallet } from "@/hooks/wallet/use-dual-wallet"

export function CustomRegistration() {
  const { ethAddress } = useDualWallet()
  const { registerUser, isLoading, error } = useGiverRegistration()

  // Your custom logic here
  return <div>Custom registration UI</div>
}
```

## Validation Rules

### Ethereum Address

- Must be 42 characters (0x + 40 hex chars)
- Checked from connected wallet
- Validated on blockchain

### Stacks Address

- Must start with `ST`
- Must be exactly 34 characters
- Checked in real-time during input
- Visual feedback provided

### Message Format

- Standard format: `I own {stacksAddress} on Stacks`
- User sees exact message before signing
- Message is signed with Ethereum wallet

## Security Considerations

✅ **Private Key Safety**

- Never stored or transmitted
- Only signature is sent to service
- Message signing happens locally in wallet

✅ **Wallet Integration**

- Uses MetaMask's `personal_sign` method
- User controls signing process
- Clear message preview before signing

✅ **Input Validation**

- All inputs validated before sending
- Format checking prevents invalid addresses
- Server validates all data

✅ **Error Handling**

- Errors don't expose sensitive data
- User-friendly error messages
- Proper error boundaries

## Styling & Theming

The form uses Tailwind CSS with the project's design tokens:

- Primary colors for buttons and accents
- Destructive colors for errors
- Muted colors for secondary text
- Green colors for success states
- Responsive design (mobile-first)

Customize via Tailwind configuration:

```javascript
// tailwind.config.ts
// All colors use CSS variables from your theme
```

## API Response Types

### RegisterResponse

```typescript
{
  success: boolean
  message: string
  user_id?: number
  eth_address?: string
  stacks_address?: string
}
```

### LookupResponse

```typescript
{
  found: boolean
  eth_address?: string
  stacks_address?: string
}
```

## Troubleshooting

### "Ethereum wallet not found"

- Install MetaMask or another Web3 wallet
- Ensure wallet is connected
- Refresh the page

### "Stacks address must start with ST"

- Check the address format
- Copy from official Stacks wallet
- Verify 34 character length

### "Registration failed"

- Check Giver service is running
- Verify API URL is correct
- Check network connection
- Look at browser console for details

### "Failed to sign message"

- Confirm MetaMask window appears
- Click "Sign" in MetaMask popup
- Don't reject the signing request
- Check wallet is unlocked

## Type Exports

```typescript
// Import types for your own components
import type {
  UseGiverRegistrationReturn,
  GiverRegistrationFormProps,
} from "@/hooks/use-giver-registration"
import type { GiverRegistrationFormProps } from "@/components/bridge/giver-registration-form"
```

## Browser Support

- Chrome/Edge (with MetaMask)
- Firefox (with MetaMask)
- Safari (with MetaMask)
- Mobile browsers (with MetaMask Mobile)

## Performance Notes

- Hook memoizes callbacks with `useCallback`
- Component re-renders only when necessary
- API calls are debounced where appropriate
- No unnecessary dependencies in effect arrays

## Future Enhancements

Potential improvements:

- WalletConnect integration for mobile
- Multiple wallet support (Rainbow, Coinbase)
- Transaction history display
- Rate limiting indicators
- Batch registration
- Custom message templates
