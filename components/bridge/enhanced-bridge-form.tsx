"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import * as P from 'micro-packed'
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useBalance,
} from "wagmi"
import type {
  BridgeInitiateRequest,
  BridgeInitiateResponse,
  BridgeStatusResponse,
  UsdcDepositStatus,
} from "@/types/bridge"
import type { Opportunity } from "@/types/opportunity"
import { ERC20_ABI, X_RESERVE_ABI } from "@/lib/abis"
import { bytes32FromBytes, remoteRecipientCoder } from "@/lib/bridge-utils"
import { cn } from "@/lib/utils"
import { useDualWallet } from "@/hooks/wallet/use-dual-wallet"
import { useGiverRegistration } from "@/hooks/use-giver-registration"
import { Button } from "@/components/ui/button"
import { Typography } from "@/components/global/typography"
import { Input } from "@/components/ui/input"
import {
  Stepper,
  StepperContent,
  StepperStep,
  StepperTrigger,
} from "@/components/ui/stepper"
import { ProtocolSelector } from "@/components/bridge/protocol-selector"
import { RewardPreview } from "@/components/bridge/reward-preview"
import { WalletPanel } from "@/components/bridge/wallet-panel"

const DEMO_ETH_ADDRESS = "0x0A5728c5953634f9b9F132843bdE1B593Ce174Bb"
const DEMO_STACKS_ADDRESS = "ST1M33KB90FAQYD26MHPQGJ13HEGKFYWNAQMCKEBR"
const X_RESERVE_CONTRACT = "0x008888878f94C0d87defdf0B07f46B93C1934442"
const ETH_USDC_CONTRACT = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
// The vault contract name "walletContract" is 14 chars — exceeds the 10-char limit of
// Circle's xReserve bytes32 format. Use the operator's standard address instead.
// Circle mints USDCx to this address; the Rust backend distributes from the vault.
const VAULT_OPERATOR_STACKS_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"

function parseAmount(v: string) {
  const cleaned = v.replace(/,/g, "").trim()
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

async function initiateBridge(payload: BridgeInitiateRequest) {
  const res = await fetch("/api/bridge/initiate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = (await res.json()) as BridgeInitiateResponse & { error?: string }
  if (!res.ok) throw new Error(json.error || "Bridge initiation failed")
  return json
}

async function fetchDepositStatus(txHash: string): Promise<UsdcDepositStatus> {
  const res = await fetch(
    `/api/bridge/deposit-status?txHash=${txHash}&network=testnet`,
    { cache: "no-store" }
  )
  if (!res.ok) throw new Error("Status fetch failed")
  return res.json()
}

async function fetchStatus(requestId: string) {
  const res = await fetch(`/api/bridge/status/${requestId}`, {
    cache: "no-store",
  })
  const json = (await res.json()) as BridgeStatusResponse & { error?: string }
  if (!res.ok) throw new Error(json.error || "Status fetch failed")
  return json
}

function StatusPill({
  label,
  status,
}: {
  label: string
  status: "pending" | "active" | "done" | "error"
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2",
        status === "done" && "border-green-500/30 bg-green-500/5",
        status === "active" && "border-primary/30 bg-primary/5",
        status === "error" && "border-destructive/30 bg-destructive/5",
        status === "pending" && "border-border bg-muted/20"
      )}
    >
      {status === "done" ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : status === "active" ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : status === "error" ? (
        <XCircle className="h-4 w-4 text-destructive" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-border" />
      )}
      <Typography variant="caption" weight="medium">
        {label}
      </Typography>
    </div>
  )
}

export function EnhancedBridgeForm({ className }: { className?: string }) {
  const wallet = useDualWallet()
  const { address: ethAddress } = useAccount()

  // Core state
  const [amountInput, setAmountInput] = useState("10")
  const [autoDeploy, setAutoDeploy] = useState(true)
  const [referrerCode, setReferrerCode] = useState("")
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(1)
  const [depositInitiated, setDepositInitiated] = useState(false)
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Bridge mode + address selection
  const [bridgeMode, setBridgeMode] = useState<"fast" | "simple">("fast")
  const [stacksAddressMode, setStacksAddressMode] = useState<"wallet" | "custom">("wallet")
  const [customStacksAddress, setCustomStacksAddress] = useState("")
  const [fastBridgeInitiated, setFastBridgeInitiated] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Balances
  const { data: usdcBalanceData } = useReadContract({
    address: ETH_USDC_CONTRACT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [ethAddress!],
    query: { enabled: !!ethAddress },
  })
  const { data: ethBalanceData } = useBalance({ address: ethAddress })

  const usdcBalance = useMemo(
    () => (usdcBalanceData ? Number(usdcBalanceData) / 1e6 : 0),
    [usdcBalanceData]
  )
  const usdcBalanceBigInt = useMemo(
    () => (usdcBalanceData as bigint | undefined) ?? undefined,
    [usdcBalanceData]
  )
  const ethBalance = useMemo(
    () =>
      ethBalanceData?.value !== undefined
        ? `${(Number(ethBalanceData.value) / 1e18).toFixed(4)} ETH`
        : "0.0000 ETH",
    [ethBalanceData]
  )

  const amount = useMemo(() => parseAmount(amountInput), [amountInput])
  const hasReferral = referrerCode.trim().length > 0
  const amountMicroUsdc = useMemo(() => BigInt(Math.round(amount * 1e6)), [amount])

  // Registration hook — passes USDC balance for fast bridge fee check
  const { insufficientFastBridgeFunds } = useGiverRegistration(
    amountMicroUsdc,
    usdcBalanceBigInt
  )

  // Effective addresses
  const effectiveEthAddress = wallet.ethAddress || DEMO_ETH_ADDRESS
  const userStacksRecipient =
    stacksAddressMode === "wallet"
      ? wallet.stacksAddress || DEMO_STACKS_ADDRESS
      : customStacksAddress

  // Fast Bridge: USDCx minted to vault operator's standard address; backend distributes to user
  // Simple Bridge: USDCx minted directly to user's Stacks address by Circle
  const effectiveStacksAddress =
    bridgeMode === "fast" ? VAULT_OPERATOR_STACKS_ADDRESS : userStacksRecipient

  const isStacksRecipientValid =
    stacksAddressMode === "wallet"
      ? wallet.isStacksConnected
      : /^S[TP][A-Z0-9]{38,}$/.test(customStacksAddress)

  // USDCx balance on Stacks for the recipient address
  const stacksUsdcxQuery = useQuery({
    queryKey: ["stacks-usdcx-balance", userStacksRecipient],
    queryFn: async () => {
      const res = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${userStacksRecipient}/balances`
      )
      if (!res.ok) return 0
      const data = await res.json()
      const tokens: Record<string, { balance: string }> = data.fungible_tokens || {}
      const key = Object.keys(tokens).find((k) => k.toLowerCase().includes("usdcx"))
      return key ? Number(tokens[key].balance) / 1e6 : 0
    },
    enabled: Boolean(userStacksRecipient) && isStacksRecipientValid,
    refetchInterval: 30_000,
  })
  const stacksUsdcxBalance = stacksUsdcxQuery.data ?? null

  // Mutations
  const mutation = useMutation({
    mutationFn: initiateBridge,
    onSuccess: (res) => {
      setRequestId(res.requestId)
    },
  })

  const {
    writeContractAsync: approve,
    isPending: isApproving,
    data: approveTxHash,
  } = useWriteContract()

  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalSuccess,
    isError: isApprovalError,
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: Boolean(approveTxHash) },
  })

  const {
    isLoading: isConfirmingDeposit,
    isSuccess: isDepositSuccess,
    isError: isDepositError,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    query: { enabled: Boolean(depositTxHash) },
  })

  const { writeContractAsync: deposit, isPending: isDepositing } = useWriteContract()

  // Poll USDC API after ETH deposit confirmed on-chain
  const depositStatusQuery = useQuery({
    queryKey: ["usdc-deposit-status", depositTxHash],
    queryFn: () => fetchDepositStatus(depositTxHash!),
    enabled: Boolean(depositTxHash) && isDepositSuccess,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s === "completed" || s === "failed" || s === "invalid" ? false : 5_000
    },
  })

  // Poll Rust backend status (Fast Bridge only, after initiation)
  const statusQuery = useQuery({
    queryKey: ["bridge-status", requestId],
    queryFn: () => fetchStatus(requestId as string),
    enabled: Boolean(requestId) && bridgeMode === "fast" && fastBridgeInitiated,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      if (!s) return 1_000
      return s === "completed" || s === "failed" ? false : 1_000
    },
  })

  // Trigger deposit after approval confirmed
  useEffect(() => {
    const executeDeposit = async () => {
      if (isApprovalSuccess && !depositInitiated && !depositTxHash) {
        setDepositInitiated(true)
        const baseValue = BigInt(Math.round(amount * 1e6))
        // Fast Bridge includes 2 USDC fee in the deposit
        const depositValue =
          bridgeMode === "fast" ? baseValue + BigInt(2_000_000) : baseValue
        const remoteRecipient = bytes32FromBytes(
          remoteRecipientCoder.encode(effectiveStacksAddress)
        )
        try {
          console.log("✅ Approval confirmed, depositing to xReserve...")
          const depositHash = await deposit({
            address: X_RESERVE_CONTRACT,
            abi: X_RESERVE_ABI,
            functionName: "depositToRemote",
            args: [depositValue, 10003, remoteRecipient, ETH_USDC_CONTRACT, BigInt(0), "0x"],
          })
          console.log("Deposit tx hash:", depositHash)
          setRequestId(depositHash)
          setDepositTxHash(depositHash)

          // Register with backend so it can match the Circle deposit and distribute
          if (bridgeMode === "fast") {
            mutation.mutate({
              amount,
              mode: "fast",
              autoDeploy,
              referrerCode: hasReferral ? referrerCode.trim() : undefined,
              ethAddress: effectiveEthAddress,
              stacksAddress: userStacksRecipient,
              depositTxHash: depositHash,
            })
          }
        } catch (e: unknown) {
          console.error("Deposit failed", e)
          const msg = e instanceof Error ? e.message : String(e)
          // User rejected — keep depositInitiated=true so the effect doesn't loop
          setDepositError(msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("denied")
            ? "Transaction cancelled"
            : msg)
        }
      }
    }

    if (activeStep === 4) {
      executeDeposit()
    }
  }, [
    approveTxHash,
    isApprovalSuccess,
    isDepositing,
    amount,
    deposit,
    effectiveStacksAddress,
    activeStep,
    depositInitiated,
    depositTxHash,
    bridgeMode,
  ])

  // Trigger Fast Bridge backend call as soon as ETH deposit confirms on-chain
  useEffect(() => {
    if (
      bridgeMode === "fast" &&
      isDepositSuccess &&
      !fastBridgeInitiated &&
      depositTxHash
    ) {
      setFastBridgeInitiated(true)
      mutation.mutate({
        amount,
        mode: "fast",
        targetProtocol: selected?.name,
        autoDeploy,
        referrerCode: hasReferral ? referrerCode.trim() : undefined,
        ethAddress: effectiveEthAddress,
        stacksAddress: userStacksRecipient,
        depositTxHash,
      })
    }
  }, [
    bridgeMode,
    isDepositSuccess,
    fastBridgeInitiated,
    depositTxHash,
    amount,
    selected,
    autoDeploy,
    referrerCode,
    hasReferral,
    effectiveEthAddress,
    userStacksRecipient,
  ])

  // --- Status pill states ---
  let pillApprove: "pending" | "active" | "done" | "error"
  if (!approveTxHash) {
    pillApprove = "pending"
  } else if (isApproving || isConfirmingApproval) {
    pillApprove = "active"
  } else if (isApprovalSuccess) {
    pillApprove = "done"
  } else if (isApprovalError) {
    pillApprove = "error"
  } else {
    pillApprove = "pending"
  }

  let pillDeposit: "pending" | "active" | "done" | "error"
  if (!depositTxHash) {
    pillDeposit = isApprovalSuccess ? "active" : "pending"
  } else if (isDepositing || isConfirmingDeposit) {
    pillDeposit = "active"
  } else if (isDepositSuccess) {
    pillDeposit = "done"
  } else if (isDepositError) {
    pillDeposit = "error"
  } else {
    pillDeposit = "pending"
  }

  const usdcStatus = depositStatusQuery.data?.status
  let pillConfirmed: "pending" | "active" | "done" | "error"
  if (!isDepositSuccess) {
    pillConfirmed = "pending"
  } else if (usdcStatus === "completed") {
    pillConfirmed = "done"
  } else if (usdcStatus === "invalid" || usdcStatus === "failed") {
    pillConfirmed = "error"
  } else {
    pillConfirmed = "active"
  }

  let pillDistributing: "pending" | "active" | "done" | "error" = "pending"
  if (fastBridgeInitiated) {
    if (statusQuery.data?.status === "completed") {
      pillDistributing = "done"
    } else if (statusQuery.data?.status === "failed") {
      pillDistributing = "error"
    } else {
      pillDistributing = "active"
    }
  }

  const isBridgeComplete =
    bridgeMode === "fast"
      ? statusQuery.data?.status === "completed"
      : usdcStatus === "completed"

  // --- Step validation ---
  const isAmountExceedingBalance = useMemo(() => amount > usdcBalance, [amount, usdcBalance])

  const isStep2Valid = useMemo(() => {
    const isFeeOk = bridgeMode === "simple" || !insufficientFastBridgeFunds
    return (
      amount > 0 &&
      !isAmountExceedingBalance &&
      isStacksRecipientValid &&
      isFeeOk
    )
  }, [
    amount,
    isAmountExceedingBalance,
    bridgeMode,
    insufficientFastBridgeFunds,
    isStacksRecipientValid,
  ])

  const bridgeSteps = [
    { id: "step-1", title: "Connect Wallets", description: "Ethereum & Stacks" },
    {
      id: "step-2",
      title: "Bridge Details",
      description: bridgeMode === "fast" ? "Mode, Amount & Address" : "Amount & Address",
    },
    { id: "step-3", title: "Review & Approve", description: "Confirm Transaction" },
    { id: "step-4", title: "Bridge & Track", description: "Track Progress" },
  ]

  if (!isMounted) {
    return (
      <div className={cn("mx-auto w-full max-w-5xl", className)}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const isBridging = isApproving || isConfirmingApproval || isDepositing

  const handleBridge = async () => {
    const baseValue = BigInt(Math.round(amount * 1e6))
    // Fast Bridge approval covers amount + 2 USDC fee
    const approveValue = bridgeMode === "fast" ? baseValue + BigInt(2_000_000) : baseValue
    try {
      const approveHash = await approve({
        address: ETH_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [X_RESERVE_CONTRACT, approveValue],
      })
      console.log("Approval tx hash:", approveHash)
      setActiveStep(4)
    } catch (e) {
      console.error("Approval failed", e)
    }
  }

  const handleReset = () => {
    setActiveStep(1)
    setRequestId(null)
    setAmountInput("10")
    setDepositInitiated(false)
    setDepositTxHash(undefined)
    setFastBridgeInitiated(false)
    setDepositError(null)
  }

  const handleRetryDeposit = () => {
    setDepositError(null)
    setDepositInitiated(false)
  }

  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      <Stepper step={activeStep} onStepChange={setActiveStep} numberOfSteps={4} disableForwardNav>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Triggers */}
          <nav className="flex flex-col gap-2">
            {bridgeSteps.map((step, i) => {
              const stepNum = i + 1
              const isActive = activeStep === stepNum
              const isCompleted = activeStep > stepNum

              return (
                <StepperTrigger
                  key={step.id}
                  step={stepNum}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    isCompleted && "border-primary/50 text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-background text-muted-foreground",
                      isCompleted && "border-primary/50 bg-primary/20 text-primary"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>
                  </div>
                </StepperTrigger>
              )
            })}
          </nav>

          {/* Content Area */}
          <div className="flex-1">
            <StepperContent className="min-h-100">
              {/* Step 1: Connect Wallets */}
              <StepperStep step={1}>
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card/50 p-6">
                    <WalletPanel
                      ethAddress={wallet.ethAddress}
                      isEthConnected={wallet.isEthConnected}
                      isEthConnecting={wallet.isEthConnecting}
                      onConnectEth={wallet.connectEth}
                      onDisconnectEth={wallet.disconnectEth}
                      stacksAddress={wallet.stacksAddress}
                      isStacksConnected={wallet.isStacksConnected}
                      isStacksConnecting={wallet.isStacksConnecting}
                      onConnectStacks={wallet.connectStacks}
                      onDisconnectStacks={wallet.disconnectStacks}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setActiveStep(2)}
                      disabled={!wallet.isEthConnected}
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {!wallet.isEthConnected && (
                    <Typography
                      variant="caption"
                      textColor="muted-foreground"
                      className="block text-right"
                    >
                      Connect your Ethereum wallet to proceed
                    </Typography>
                  )}
                </div>
              </StepperStep>

              {/* Step 2: Bridge Details */}
              <StepperStep step={2}>
                <div className="space-y-6">
                  <div className="grid gap-6 rounded-lg border border-border bg-card/50 p-6">

                    {/* Bridge Mode Toggle */}
                    <div className="space-y-2">
                      <Typography variant="caption" textColor="muted-foreground">
                        Bridge Mode
                      </Typography>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={bridgeMode === "fast" ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setBridgeMode("fast")}
                        >
                          Fast Bridge
                        </Button>
                        <Button
                          variant={bridgeMode === "simple" ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setBridgeMode("simple")}
                        >
                          Simple Bridge
                        </Button>
                      </div>
                      <Typography variant="caption" textColor="muted-foreground">
                        {bridgeMode === "fast"
                          ? "2 USDCx fee · We send to your wallet"
                          : "No fee · Circle mints directly"}
                      </Typography>
                    </div>

                    {/* Amount + Protocol */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Typography variant="caption" textColor="muted-foreground">
                          Amount (USDC)
                        </Typography>
                        <div className="relative">
                          <Input
                            inputMode="decimal"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            placeholder="0.00"
                            className={cn(
                              "pr-12",
                              isAmountExceedingBalance && "border-destructive"
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setAmountInput(usdcBalance?.toString() ?? "0")}
                            disabled={usdcBalance === null}
                          >
                            Max
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <Typography variant="caption" textColor="muted-foreground">
                            Balance: {usdcBalance?.toFixed(2) ?? "..."} USDC
                          </Typography>
                          <Typography variant="caption" textColor="muted-foreground">
                            {ethBalance ?? "..."}
                          </Typography>
                        </div>

                        {/* Fee breakdown (Fast Bridge only) */}
                        {bridgeMode === "fast" && amount > 0 && (
                          <div className="mt-2 rounded-md border border-border bg-muted/20 p-3 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bridge amount</span>
                              <span>{amount.toFixed(2)} USDC</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service fee</span>
                              <span>2.00 USDC</span>
                            </div>
                            <div className="flex justify-between font-medium border-t border-border pt-1">
                              <span className="text-muted-foreground">You receive</span>
                              <span>{amount.toFixed(2)} USDCx on Stacks</span>
                            </div>
                          </div>
                        )}

                        {/* Insufficient funds error */}
                        {bridgeMode === "fast" && insufficientFastBridgeFunds && (
                          <Typography variant="caption" className="text-destructive block">
                            Insufficient USDC (need {(amount + 2).toFixed(2)} USDC)
                          </Typography>
                        )}
                      </div>

                      {/* Protocol selector: Fast Bridge only, optional */}
                      {bridgeMode === "fast" && (
                        <div className="space-y-1">
                          <Typography variant="caption" textColor="muted-foreground">
                            Optional: Invest after bridge
                          </Typography>
                          <ProtocolSelector
                            value={selected?.name ?? null}
                            onValueChange={(o: Opportunity | null) => setSelected(o)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Stacks Address Toggle */}
                    <div className="space-y-2">
                      <Typography variant="caption" textColor="muted-foreground">
                        Stacks Recipient
                      </Typography>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={stacksAddressMode === "wallet" ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setStacksAddressMode("wallet")}
                        >
                          Connected Wallet
                        </Button>
                        <Button
                          variant={stacksAddressMode === "custom" ? "default" : "outline"}
                          size="sm"
                          type="button"
                          onClick={() => setStacksAddressMode("custom")}
                        >
                          Custom Address
                        </Button>
                      </div>
                      {stacksAddressMode === "wallet" && (
                        <div className="flex items-center justify-between">
                          <Typography variant="caption" textColor="muted-foreground">
                            {wallet.stacksAddress
                              ? `${wallet.stacksAddress.slice(0, 8)}...${wallet.stacksAddress.slice(-4)}`
                              : "No Stacks wallet connected"}
                          </Typography>
                          {isStacksRecipientValid && (
                            <Typography variant="caption" textColor="muted-foreground">
                              {stacksUsdcxBalance !== null
                                ? `${stacksUsdcxBalance.toFixed(2)} USDCx`
                                : "..."}
                            </Typography>
                          )}
                        </div>
                      )}
                      {stacksAddressMode === "custom" && (
                        <div className="space-y-1">
                          <Input
                            value={customStacksAddress}
                            onChange={(e) => setCustomStacksAddress(e.target.value)}
                            placeholder="ST... or SP..."
                            className={cn(
                              !isStacksRecipientValid &&
                                customStacksAddress.length > 0 &&
                                "border-destructive"
                            )}
                          />
                          {!isStacksRecipientValid && customStacksAddress.length > 0 && (
                            <Typography variant="caption" className="text-destructive">
                              Invalid Stacks address format
                            </Typography>
                          )}
                          {isStacksRecipientValid && customStacksAddress.length > 0 && (
                            <div className="flex justify-end">
                              <Typography variant="caption" textColor="muted-foreground">
                                {stacksUsdcxBalance !== null
                                  ? `${stacksUsdcxBalance.toFixed(2)} USDCx`
                                  : "..."}
                              </Typography>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Auto-deploy + referral (Fast Bridge + protocol selected) */}
                    {bridgeMode === "fast" && selected && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Typography variant="caption" textColor="muted-foreground">
                            Auto-deploy to protocol
                          </Typography>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant={autoDeploy ? "default" : "outline"}
                              size="sm"
                              textVariant="caption"
                              textWeight="bold"
                              onClick={() => setAutoDeploy(true)}
                              type="button"
                            >
                              ON (+30%)
                            </Button>
                            <Button
                              variant={!autoDeploy ? "default" : "outline"}
                              size="sm"
                              textVariant="caption"
                              textWeight="bold"
                              onClick={() => setAutoDeploy(false)}
                              type="button"
                            >
                              OFF
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Typography variant="caption" textColor="muted-foreground">
                            Referral code (optional)
                          </Typography>
                          <Input
                            value={referrerCode}
                            onChange={(e) => setReferrerCode(e.target.value)}
                            placeholder="e.g. BUILDER123"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setActiveStep(3)} disabled={!isStep2Valid}>
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {!isStep2Valid && wallet.isEthConnected && (
                    <Typography
                      variant="caption"
                      textColor="muted-foreground"
                      className="block text-right"
                    >
                      {bridgeMode === "fast" && insufficientFastBridgeFunds
                        ? `Need ${(amount + 2).toFixed(2)} USDC (amount + 2 fee)`
                        : !isStacksRecipientValid
                        ? "Enter a valid Stacks address"
                        : "Please check your balance or enter a valid amount"}
                    </Typography>
                  )}
                </div>
              </StepperStep>

              {/* Step 3: Review & Approve */}
              <StepperStep step={3}>
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4 rounded-lg border border-border bg-card/50 p-6">
                      <Typography variant="h6" family="head" weight="bold">
                        Transaction Summary
                      </Typography>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bridge Mode</span>
                          <span className="font-medium">
                            {bridgeMode === "fast"
                              ? "Fast Bridge (2 USDCx fee)"
                              : "Simple Bridge (no fee)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">{amount} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Fee</span>
                          <span className="font-medium">
                            {bridgeMode === "fast" ? "2.00 USDC" : "None"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stacks Recipient</span>
                          <span className="font-mono text-xs font-medium">
                            {userStacksRecipient.slice(0, 8)}...
                            {userStacksRecipient.slice(-4)}
                          </span>
                        </div>
                        {bridgeMode === "fast" && selected && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Invest in Protocol</span>
                              <span className="font-medium">{selected.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Auto-Deploy</span>
                              <span className="font-medium">
                                {autoDeploy ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Referral</span>
                              <span className="font-medium">
                                {hasReferral ? referrerCode : "None"}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Time</span>
                          <span className="font-medium">
                            {bridgeMode === "fast" ? "~1 minute" : "~15 minutes"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <Typography variant="caption" textColor="muted-foreground">
                          Wallet: {effectiveEthAddress.slice(0, 6)}...
                          {effectiveEthAddress.slice(-4)}
                        </Typography>
                      </div>
                    </div>

                    {bridgeMode === "fast" && selected ? (
                      <RewardPreview
                        amount={amount}
                        autoDeploy={autoDeploy}
                        hasReferral={hasReferral}
                        userTotalBridged={0}
                        className="w-full"
                      />
                    ) : null}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(2)}>
                      Back
                    </Button>
                    <Button onClick={handleBridge} disabled={isBridging} size="lg">
                      {isBridging ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isConfirmingApproval ? "Confirming..." : "Initiating..."}
                        </>
                      ) : (
                        <>
                          Approve & Bridge
                          <Shield className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  {mutation.error && (
                    <Typography
                      variant="caption"
                      className="block text-right text-destructive"
                    >
                      {(mutation.error as Error).message}
                    </Typography>
                  )}
                </div>
              </StepperStep>

              {/* Step 4: Bridge & Track */}
              <StepperStep step={4}>
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-card/50 p-6">
                    <div className="mb-6 flex items-center justify-between gap-3">
                      <Typography variant="h6" family="head" weight="bold">
                        Bridge Status
                      </Typography>
                      {depositTxHash && (
                        <Typography variant="caption" textColor="muted-foreground">
                          ID: {depositTxHash.slice(0, 8)}
                        </Typography>
                      )}
                    </div>

                    {/* Invalid deposit error */}
                    {usdcStatus === "invalid" && (
                      <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                        <Typography variant="caption" className="text-destructive">
                          Deposit flagged invalid by Circle. Please contact support.
                        </Typography>
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Status Pills */}
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <StatusPill label="ETH Approved" status={pillApprove} />
                        <StatusPill label="ETH Deposited" status={pillDeposit} />
                        {bridgeMode === "fast" ? (
                          <StatusPill label="USDCx Distributing" status={pillDistributing} />
                        ) : (
                          <StatusPill
                            label="Complete"
                            status={usdcStatus === "completed" ? "done" : "pending"}
                          />
                        )}
                      </div>

                      {/* TX Links */}
                      <div className="space-y-2 border-t border-border pt-4">
                        {(depositTxHash || approveTxHash) && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Ethereum Tx</span>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${depositTxHash || approveTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-primary hover:underline"
                              >
                                {(depositTxHash || approveTxHash)?.slice(0, 18)}...
                              </a>
                            </div>
                            <Typography
                              variant="caption"
                              textColor="muted-foreground"
                              className="block text-center mt-2"
                            >
                              USDC will arrive after an average of {bridgeMode === "fast" ? "1 minute" : "15 minutes"}.
                            </Typography>
                          </>
                        )}
                        {statusQuery.data?.stacksTxId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stacks Tx</span>
                            <a
                              href={`https://explorer.stacks.co/txid/${statusQuery.data.stacksTxId}?chain=testnet`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-primary hover:underline"
                            >
                              {statusQuery.data.stacksTxId.slice(0, 18)}...
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Protocol CTA (Fast Bridge, after complete, protocol selected) */}
                      {bridgeMode === "fast" && isBridgeComplete && selected && (
                        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                          <Typography variant="p1" weight="medium" className="mb-1">
                            Your {amount} USDCx is in your wallet.
                          </Typography>
                          <Typography variant="caption" textColor="muted-foreground">
                            Earn {(selected as any).apy ?? "~"}% APY on {selected.name} →
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>

                  {depositError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                      <Typography variant="caption" className="text-destructive block">
                        {depositError}
                      </Typography>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleRetryDeposit}>
                          Retry Deposit
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleReset}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!depositError && (
                    <div className="flex justify-center gap-3">
                      {usdcStatus === "invalid" ? (
                        <Button variant="outline" onClick={handleReset}>
                          Start Over
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleReset}>
                          Start New Bridge
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </StepperStep>
            </StepperContent>
          </div>
        </div>
      </Stepper>
    </div>
  )
}
