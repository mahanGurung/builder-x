"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Loader2, Shield, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDualWallet } from "@/hooks/wallet/use-dual-wallet"
import { useGiverRegistration } from "@/hooks/use-giver-registration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Typography } from "@/components/global/typography"
import { Badge } from "@/components/ui/badge"

export interface GiverRegistrationFormProps {
  onRegistrationSuccess?: (userId: number) => void
  onRegistrationError?: (error: string) => void
  transferAmount?: bigint
}

/**
 * Registration form component for Giver bridge service
 * Allows users to register their Ethereum address with their Stacks address
 * Displays vault status and checks for sufficient liquidity before transfer
 * Requires: actualBalance >= (transferAmount + 2 USDC fee)
 */
function GiverRegistrationForm(props: GiverRegistrationFormProps) {
  const wallet = useDualWallet()
  // Pass requested amount to hook for liquidity checks
  const registration = useGiverRegistration(props.transferAmount)

  const [stacksAddress, setStacksAddress] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [showLookup, setShowLookup] = useState(false)
  const [showVaultStatus, setShowVaultStatus] = useState(false)
  const [transferAmount, setTransferAmount] = useState<string>("")
  const [amountError, setAmountError] = useState<string | null>(null)

  const ethAddress = wallet.ethAddress
  const isValid =
    ethAddress &&
    stacksAddress.startsWith("ST") &&
    stacksAddress.length === 34 &&
    !registration.isLoading &&
    !isSigning &&
    !registration.insufficientVaultLiquidity &&
    !registration.isVaultPaused &&
    !amountError

  // Validate Stacks address format
  const isStacksAddressValid =
    stacksAddress.length === 0 ||
    (stacksAddress.startsWith("ST") && stacksAddress.length === 34)

  const stacksAddressError =
    stacksAddress.length > 0 && !isStacksAddressValid
      ? "Stacks address must start with ST and be 34 characters long"
      : null

  // Load vault state on mount
  useEffect(() => {
    const loadVaultState = async () => {
      try {
        await registration.getVaultState()
      } catch (err) {
        console.error("Failed to load vault state:", err)
      }
    }

    loadVaultState()
  }, [registration])

  // Handle transfer amount input with real-time balance checking
  const handleTransferAmountChange = useCallback(
    async (value: string) => {
      setTransferAmount(value)
      setAmountError(null)

      // Allow empty input
      if (!value) {
        return
      }

      // Validate input is a valid number
      const numValue = parseFloat(value)
      if (isNaN(numValue) || numValue < 0) {
        setAmountError("Please enter a valid amount")
        return
      }

      // If no balance loaded yet, fetch it
      if (registration.actualBalance === null) {
        try {
          await registration.getActualBalance()
        } catch (err) {
          console.error("Failed to fetch balance:", err)
          setAmountError("Unable to fetch vault balance")
          return
        }
      }

      // Check if amount exceeds available balance (accounting for 2 USDC fee)
      if (registration.actualBalance !== null) {
        const amountInMicroUSDC = BigInt(Math.floor(numValue * 1_000_000))
        const requiredAmount = amountInMicroUSDC + BigInt(2_000_000) // Add 2 USDC fee
        const availableBalance = registration.actualBalance

        if (requiredAmount > availableBalance) {
          const availableUSDC =
            Number(availableBalance - BigInt(2_000_000)) / 1_000_000
          setAmountError(
            `Insufficient balance. Max available: ${Math.max(0, availableUSDC).toFixed(2)} USDC (after 2 USDC fee)`
          )
        }
      }
    },
    [registration]
  )
  const handleSign = useCallback(async () => {
    if (!ethAddress || !stacksAddress) return

    // Validate transfer amount if provided
    if (transferAmount && amountError) {
      setLookupError("Please fix the transfer amount error before proceeding")
      return
    }

    setIsSigning(true)
    registration.clearError()

    try {
      // Check vault liquidity based on transferAmount input
      if (transferAmount && registration.actualBalance !== null) {
        const amountInMicroUSDC = BigInt(
          Math.floor(parseFloat(transferAmount) * 1_000_000)
        )
        const requiredAmount = amountInMicroUSDC + BigInt(2_000_000) // 2 USDC fee
        if (registration.actualBalance < requiredAmount) {
          const availableUSDC = Number(registration.actualBalance) / 1_000_000
          const requiredUSDC = Number(requiredAmount) / 1_000_000
          const errorMsg = `Vault has insufficient liquidity. Available: ${availableUSDC.toFixed(2)} USDC, Required: ${requiredUSDC.toFixed(2)} USDC`
          setLookupError(errorMsg)
          props.onRegistrationError?.(errorMsg)
          setIsSigning(false)
          return
        }
      } else if (props.transferAmount && registration.actualBalance !== null) {
        // Fall back to props.transferAmount if available
        const requiredAmount = props.transferAmount + BigInt(2000000) // 2 USDC fee
        if (registration.actualBalance < requiredAmount) {
          const availableUSDC = Number(registration.actualBalance) / 1_000_000
          const requiredUSDC = Number(requiredAmount) / 1_000_000
          const errorMsg = `Vault has insufficient liquidity. Available: ${availableUSDC.toFixed(2)} USDC, Required: ${requiredUSDC.toFixed(2)} USDC`
          setLookupError(errorMsg)
          props.onRegistrationError?.(errorMsg)
          setIsSigning(false)
          return
        }
      }

      // Create the message to sign
      const message = `I own ${stacksAddress} on Stacks`

      // Request signature from wallet (MetaMask)
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = (window as any).ethereum

        try {
          // Use eth_signMessage for MetaMask
          const sig = await provider.request({
            method: "personal_sign",
            params: [message, ethAddress],
          })

          setSignature(sig)

          // Now register with the signature
          const response = await registration.registerUser(
            ethAddress,
            stacksAddress,
            sig,
            message
          )

          if (response && response.success) {
            props.onRegistrationSuccess?.(response.user_id || 0)
          } else {
            const errorMsg =
              response?.message || "Failed to register with service"
            setLookupError(errorMsg)
            props.onRegistrationError?.(errorMsg)
          }
        } catch (signError) {
          const message =
            signError instanceof Error
              ? signError.message
              : "Failed to sign message"
          setLookupError(message)
          props.onRegistrationError?.(message)
        }
      } else {
        setLookupError(
          "Ethereum wallet not found. Please install MetaMask or connect your wallet."
        )
        props.onRegistrationError?.("Ethereum wallet not found")
      }
    } finally {
      setIsSigning(false)
    }
  }, [ethAddress, stacksAddress, transferAmount, amountError, registration, props])

  // Handle user lookup
  const handleLookup = useCallback(
    async (address: string, type: "eth" | "stacks") => {
      setLookupError(null)
      const found = await registration.lookupUser(address, type)

      if (!found) {
        setLookupError(
          type === "eth"
            ? "No registration found for this Ethereum address"
            : "No registration found for this Stacks address"
        )
      }
    },
    [registration]
  )

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Register with Giver Bridge
        </CardTitle>
        <CardDescription>
          Connect your Ethereum wallet to your Stacks address for cross-chain USDC transfers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ethereum Address (read-only) */}
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <Typography variant="caption" weight="semibold">
              Ethereum Address
            </Typography>
            {wallet.isEthConnected && (
              <Badge variant="default" className="bg-green-500/10 text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Connect your Ethereum wallet"
              value={ethAddress || ""}
              disabled
              className={cn("pr-10", ethAddress && "bg-green-500/5")}
            />
            {ethAddress && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
            )}
          </div>
          {!wallet.isEthConnected && (
            <Typography variant="caption" textColor="destructive">
              Please connect your Ethereum wallet to continue
            </Typography>
          )}
        </div>

        {/* Stacks Address (input) */}
        <div className="space-y-2">
          <label>
            <Typography variant="caption" weight="semibold">
              Stacks Address
            </Typography>
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g., ST1234567890ABCDEF..."
              value={stacksAddress}
              onChange={(e) => {
                setStacksAddress(e.currentTarget.value.toUpperCase())
              }}
              disabled={registration.isLoading || isSigning}
              className={cn(
                stacksAddressError && "border-destructive aria-invalid:ring-1",
                stacksAddress &&
                  isStacksAddressValid &&
                  "border-green-500/30 bg-green-500/5",
                stacksAddress &&
                  !isStacksAddressValid &&
                  "border-destructive/30 bg-destructive/5"
              )}
              aria-invalid={!!stacksAddressError}
            />
            {stacksAddress && isStacksAddressValid && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
            )}
            {stacksAddressError && (
              <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
            )}
          </div>
          {stacksAddressError && (
            <Typography variant="caption" textColor="destructive">
              {stacksAddressError}
            </Typography>
          )}
          <Typography variant="caption" textColor="muted-foreground">
            Enter your Stacks address to link it with your Ethereum wallet
          </Typography>
        </div>

        {/* Transfer Amount Input */}
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <Typography variant="caption" weight="semibold">
              Transfer Amount (USDC)
            </Typography>
            {registration.isBalanceLoading && (
              <span className="text-xs text-muted-foreground">
                Checking balance...
              </span>
            )}
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter amount in USDC"
              value={transferAmount}
              onChange={(e) => handleTransferAmountChange(e.currentTarget.value)}
              disabled={
                registration.isLoading ||
                isSigning ||
                registration.actualBalance === null
              }
              min="0"
              step="0.01"
              className={cn(
                amountError && "border-destructive aria-invalid:ring-1",
                transferAmount &&
                  !amountError &&
                  "border-green-500/30 bg-green-500/5",
                transferAmount &&
                  amountError &&
                  "border-destructive/30 bg-destructive/5"
              )}
              aria-invalid={!!amountError}
            />
            {transferAmount && !amountError && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
            )}
            {amountError && (
              <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
            )}
          </div>
          {amountError && (
            <Typography variant="caption" textColor="destructive">
              {amountError}
            </Typography>
          )}
          {registration.actualBalance !== null && (
            <Typography variant="caption" textColor="muted-foreground">
              Available: {(Number(registration.actualBalance) / 1_000_000).toFixed(2)} USDC
              (includes 2 USDC transfer fee)
            </Typography>
          )}
        </div>

        {/* Message preview */}
        {stacksAddress && isStacksAddressValid && (
          <div className="rounded border border-border/50 bg-muted/20 p-3">
            <Typography variant="caption" weight="semibold" className="mb-1 block">
              Message to Sign
            </Typography>
            <Typography
              variant="caption"
              textColor="muted-foreground"
              className="font-mono"
            >
              {`I own ${stacksAddress} on Stacks`}
            </Typography>
          </div>
        )}

        {/* Vault Status Section */}
        {(showVaultStatus || registration.actualBalance !== null) && (
          <div className="space-y-3 rounded border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <Typography variant="caption" weight="semibold">
                Vault Status
              </Typography>
              <Button
                onClick={() => setShowVaultStatus(!showVaultStatus)}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
              >
                {showVaultStatus ? "−" : "+"}
              </Button>
            </div>

            {showVaultStatus && registration.actualBalance !== null && (
              <div className="space-y-2">
                {/* Vault pause status */}
                {registration.isVaultPaused !== null && (
                  <div
                    className={cn(
                      "rounded p-2",
                      registration.isVaultPaused
                        ? "border border-amber-500/30 bg-amber-500/5"
                        : "border border-green-500/30 bg-green-500/5"
                    )}
                  >
                    <Typography variant="caption" weight="semibold">
                      {registration.isVaultPaused ? (
                        <span className="text-amber-700">⚠ Vault Paused</span>
                      ) : (
                        <span className="text-green-700">✓ Vault Active</span>
                      )}
                    </Typography>
                  </div>
                )}

                {/* Actual USDCx balance */}
                <div className="rounded border border-border/50 bg-background p-2">
                  <Typography variant="caption" textColor="muted-foreground">
                    Available Balance
                  </Typography>
                  <Typography variant="p2" weight="semibold">
                    {(Number(registration.actualBalance) / 1_000_000).toFixed(2)} USDCx
                  </Typography>
                </div>

                {/* Fee information */}
                <div className="rounded border border-border/50 bg-background p-2">
                  <Typography variant="caption" textColor="muted-foreground">
                    2 USDC Transfer Fee
                  </Typography>
                  <Typography variant="p2" weight="semibold" className="text-amber-700">
                    2.00 USDCx
                  </Typography>
                </div>

                {/* Accumulated rewards */}
                {registration.rewardBalance !== null &&
                  registration.rewardBalance > BigInt(0) && (
                    <div className="rounded border border-border/50 bg-background p-2">
                      <Typography variant="caption" textColor="muted-foreground">
                        Accumulated Rewards (Owner)
                      </Typography>
                      <Typography variant="p2" weight="semibold" className="text-blue-700">
                        {(Number(registration.rewardBalance) / 1_000_000).toFixed(2)} USDCx
                      </Typography>
                    </div>
                  )}

                {/* Insufficient liquidity warning */}
                {registration.insufficientVaultLiquidity && (
                  <div className="flex gap-2 rounded border border-destructive/30 bg-destructive/5 p-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <Typography variant="caption" weight="semibold" textColor="destructive">
                        Insufficient Liquidity
                      </Typography>
                      <Typography variant="caption" textColor="destructive">
                        {props.transferAmount
                          ? `Vault has insufficient liquidity. Required: ${((Number(props.transferAmount) + 2_000_000) / 1_000_000).toFixed(2)} USDCx`
                          : "Vault has insufficient liquidity for this transfer"}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error messages */}
        {(registration.error || lookupError) && (
          <div className="flex gap-2 rounded border border-destructive/30 bg-destructive/5 p-3">
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <Typography variant="caption" weight="semibold" textColor="destructive">
                Error
              </Typography>
              <Typography variant="caption" textColor="destructive">
                {registration.error || lookupError}
              </Typography>
            </div>
            <button
              onClick={() => {
                registration.clearError()
                setLookupError(null)
              }}
              className="text-destructive hover:text-destructive/80"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success message */}
        {registration.isRegistered && !registration.error && !lookupError && (
          <div className="flex gap-2 rounded border border-green-500/30 bg-green-500/5 p-3">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <Typography variant="caption" weight="semibold" textColor="inherit">
                <span className="text-green-700">Successfully registered!</span>
              </Typography>
              <Typography variant="caption" textColor="muted-foreground">
                Your Stacks address is now linked to your Ethereum wallet.
              </Typography>
            </div>
          </div>
        )}

        {/* Signature status */}
        {signature && (
          <div className="rounded border border-primary/30 bg-primary/5 p-3">
            <Typography variant="caption" weight="semibold" className="mb-1 block">
              Signature Status
            </Typography>
            <Typography variant="caption" textColor="muted-foreground" className="font-mono break-all">
              {signature.slice(0, 10)}...{signature.slice(-8)}
            </Typography>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            onClick={handleSign}
            disabled={!isValid}
            size="lg"
            className="flex-1"
            textVariant="p2"
            textWeight="semibold"
          >
            {isSigning || registration.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isSigning ? "Signing..." : "Registering..."}
              </>
            ) : signature ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Signed
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Sign with Ethereum
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowVaultStatus(!showVaultStatus)}
            variant="outline"
            size="lg"
            textVariant="p2"
            textWeight="semibold"
          >
            {showVaultStatus ? "Hide Vault" : "Vault Status"}
          </Button>

          <Button
            onClick={() => setShowLookup(!showLookup)}
            variant="outline"
            size="lg"
            textVariant="p2"
            textWeight="semibold"
          >
            {showLookup ? "Hide Lookup" : "Check Registration"}
          </Button>
        </div>

        {/* Lookup section */}
        {showLookup && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <Typography variant="caption" weight="semibold">
              Look up existing registration
            </Typography>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter Ethereum or Stacks address"
                id="lookup-address"
                disabled={registration.isLoading}
              />
              <Button
                onClick={() => {
                  const address = (
                    document.getElementById("lookup-address") as HTMLInputElement
                  )?.value
                  if (!address) return

                  if (address.startsWith("0x")) {
                    handleLookup(address, "eth")
                  } else if (address.startsWith("ST")) {
                    handleLookup(address, "stacks")
                  } else {
                    setLookupError("Invalid address format")
                  }
                }}
                variant="outline"
                size="lg"
                disabled={registration.isLoading}
              >
                {registration.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Lookup"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { GiverRegistrationForm }
