"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
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
} from "@/types/bridge"
import type { Opportunity } from "@/types/opportunity"
import { ERC20_ABI, X_RESERVE_ABI } from "@/lib/abis"
import { bytes32FromBytes, remoteRecipientCoder } from "@/lib/bridge-utils"
import { cn } from "@/lib/utils"
import { useDualWallet } from "@/hooks/wallet/use-dual-wallet"
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

  // State
  const [amountInput, setAmountInput] = useState("10")
  const [autoDeploy, setAutoDeploy] = useState(true)
  const [referrerCode, setReferrerCode] = useState("")
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(1) // 1-based index
  const [depositInitiated, setDepositInitiated] = useState(false) // New state variable
  const [simpleBridgeCompleted, setSimpleBridgeCompleted] = useState(false) // New state for simple bridge completion
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  // Wagmi hooks for balance
  const { data: usdcBalanceData } = useReadContract({
    address: ETH_USDC_CONTRACT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [ethAddress!],
    query: {
      enabled: !!ethAddress,
    },
  })
  const { data: ethBalanceData } = useBalance({ address: ethAddress })

  const usdcBalance = useMemo(
    () => (usdcBalanceData ? Number(usdcBalanceData) / 1e6 : 0),
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

  const effectiveEthAddress = wallet.ethAddress || DEMO_ETH_ADDRESS
  const effectiveStacksAddress = wallet.stacksAddress || DEMO_STACKS_ADDRESS

  // Mutations
  const mutation = useMutation({
    mutationFn: initiateBridge,
    onSuccess: (res) => {
      setRequestId(res.requestId)
      setActiveStep(4)
    },
  })

  const {
    writeContractAsync: approve,
    isPending: isApproving,
    data: approveTxHash,
  } = useWriteContract()

  const { isLoading: isConfirmingApproval, isSuccess: isApprovalSuccess, isError: isApprovalError } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: {
      enabled: Boolean(approveTxHash),
    },
  });

  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess, isError: isDepositError } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    query: {
      enabled: Boolean(depositTxHash),
    },
  });

  const { writeContractAsync: deposit, isPending: isDepositing } =
    useWriteContract()

  const handleSimpleBridge = async () => {
    const value = BigInt(amount * 1e6)
    try {
      const approveHash = await approve({
        address: ETH_USDC_CONTRACT,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [X_RESERVE_CONTRACT, value],
      })
      console.log("Approval tx hash:", approveHash)
      setRequestId(approveHash) // Show progress early
      setActiveStep(4)

      // The useEffect below will handle the deposit after confirmation
    } catch (e) {
      console.error("Approval failed", e)
      // Optionally reset state or show an error message
    }
  }

  // Effect to trigger deposit after approval is confirmed
  useEffect(() => {
    const executeDeposit = async () => {
      if (approveTxHash && !isConfirmingApproval && !isDepositing && !depositInitiated) {
        setDepositInitiated(true) // Set to true to prevent re-execution
        const value = BigInt(amount * 1e6)
        const remoteRecipient = bytes32FromBytes(
          remoteRecipientCoder.encode(effectiveStacksAddress)
        )
        try {
          console.log("✅ Approval confirmed, now depositing...")
          const depositHash = await deposit({
            address: X_RESERVE_CONTRACT,
            abi: X_RESERVE_ABI,
            functionName: "depositToRemote",
            args: [value, 10003, remoteRecipient, ETH_USDC_CONTRACT, BigInt(0), "0x"],
          })
          console.log("Deposit tx hash:", depositHash)
          setRequestId(depositHash)
          setDepositTxHash(depositHash);
        } catch (e) {
          console.error("Deposit failed", e)
          setDepositInitiated(false) // Reset on error to allow retry
        }
      }
    }

    if (activeStep === 4 && !selected) {
      executeDeposit()
    }
  }, [
    selected,
    approveTxHash,
    isConfirmingApproval,
    isDepositing,
    amount,
    deposit,
    effectiveStacksAddress,
    activeStep,
    depositInitiated, // Add depositInitiated to dependencies
  ])

  // Queries
  const statusQuery = useQuery({
    queryKey: ["bridge-status", requestId],
    queryFn: () => fetchStatus(requestId as string),
    enabled: Boolean(requestId) && Boolean(selected),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      if (!s) return 1_000
      return s === "registered" || s === "failed" ? false : 1_000
    },
  })

    // Status mapping variables
    let currentStepApprove: "pending" | "active" | "done" | "error";
    let currentStepAttest: "pending" | "active" | "done" | "error";
    let currentStepRegister: "pending" | "active" | "done" | "error"; // Only applicable for complex bridge

    if (selected) {
        const complexBridgeStatus = statusQuery.data?.status || (requestId ? "initiated" : null);
        // Complex bridge logic
        currentStepApprove = complexBridgeStatus ? "done" : "pending";
        currentStepAttest = complexBridgeStatus === "attesting" ? "active" :
                             complexBridgeStatus === "registered" ? "done" :
                             complexBridgeStatus === "failed" ? "error" : "pending";
        currentStepRegister = complexBridgeStatus === "registered" ? "done" :
                              complexBridgeStatus === "failed" ? "error" :
                              complexBridgeStatus === "initiated" || complexBridgeStatus === "attesting" ? "active" : "pending";
    } else {
        // Simple bridge logic (Ethereum only)
        // Step 1: Approval
        if (!approveTxHash) {
            currentStepApprove = "pending";
        } else if (isApproving || isConfirmingApproval) {
            currentStepApprove = "active";
        } else if (isApprovalSuccess) {
            currentStepApprove = "done";
        } else if (isApprovalError) {
            currentStepApprove = "error";
        } else {
            currentStepApprove = "pending"; // Fallback
        }

        // Step 2: Deposit
        if (!depositTxHash) {
            currentStepAttest = "pending";
        } else if (isDepositing || isConfirmingDeposit) {
            currentStepAttest = "active";
        } else if (isDepositSuccess) {
            currentStepAttest = "done";
        } else if (isDepositError) {
            currentStepAttest = "error";
        } else {
            currentStepAttest = "pending"; // Fallback
        }
        currentStepRegister = "pending"; // Not applicable for simple bridge
    }

  // Step Validation
  const isStep1Valid = wallet.isEthConnected && wallet.isStacksConnected

  const isAmountExceedingBalance = useMemo(() => {
    return amount > usdcBalance
  }, [amount, usdcBalance])

  const isStep2Valid = useMemo(() => {
    const ethBalanceNumber = ethBalance
      ? parseFloat(ethBalance.split(" ")[0])
      : 0
    return amount > 0 && !isAmountExceedingBalance && ethBalanceNumber > 0.01
  }, [amount, isAmountExceedingBalance, ethBalance])

  const bridgeSteps = useMemo(() => {
    if (selected) {
      return [
        {
          id: "step-1",
          title: "Connect Wallets",
          description: "Ethereum & Stacks",
        },
        {
          id: "step-2",
          title: "Bridge Details",
          description: "Amount & Protocol",
        },
        {
          id: "step-3",
          title: "Review & Approve",
          description: "Confirm Transaction",
        },
        {
          id: "step-4",
          title: "Confirm Bridge",
          description: "Track Progress",
        },
      ]
    } else {
      // Simple Bridge: no protocol selected
      return [
        {
          id: "step-1",
          title: "Connect Wallets",
          description: "Ethereum & Stacks",
        },
        {
          id: "step-2",
          title: "Bridge Details",
          description: "Amount",
        },
        {
          id: "step-3",
          title: "Approve & Bridge",
          description: "Confirm Transaction",
        },
      ]
    }
  }, [selected])

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

  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      <Stepper step={activeStep} onStepChange={setActiveStep} numberOfSteps={4}>
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
                    `flex w-full items-center gap-4 rounded-lg border p-4
                    text-left transition-colors`,
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                    isCompleted && "border-primary/50 text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      `flex h-8 w-8 shrink-0 items-center justify-center
                      rounded-full border text-sm font-bold`,
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : `border-muted-foreground/30 bg-background
                          text-muted-foreground`,
                      isCompleted &&
                        "border-primary/50 bg-primary/20 text-primary"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      stepNum
                    )}
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
                    <span className="text-xs text-muted-foreground">
                      {step.description}
                    </span>
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
                  <div
                    className="rounded-lg border border-border bg-card/50 p-6"
                  >
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
                      disabled={!isStep1Valid}
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {!isStep1Valid && (
                    <Typography
                      variant="caption"
                      textColor="muted-foreground"
                      className="block text-right"
                    >
                      Connect both wallets to proceed
                    </Typography>
                  )}
                </div>
              </StepperStep>

              {/* Step 2: Bridge Details */}
              <StepperStep step={2}>
                <div className="space-y-6">
                  <div
                    className="grid gap-6 rounded-lg border border-border
                      bg-card/50 p-6"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Typography
                          variant="caption"
                          textColor="muted-foreground"
                        >
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
                            onClick={() =>
                              setAmountInput(usdcBalance?.toString() ?? "0")
                            }
                            disabled={usdcBalance === null}
                          >
                            Max
                          </Button>
                        </div>
                        <div className="flex justify-between">
                          <Typography
                            variant="caption"
                            textColor="muted-foreground"
                          >
                            Balance: {usdcBalance?.toFixed(2) ?? "..."} USDC
                          </Typography>
                          <Typography
                            variant="caption"
                            textColor="muted-foreground"
                          >
                            {ethBalance ?? "..."}
                          </Typography>
                        </div>
                        <Typography
                          variant="caption"
                          textColor="muted-foreground"
                        >
                          Rewards vest linearly over ~90 days
                        </Typography>
                      </div>

                      <ProtocolSelector
                        value={selected?.name ?? null}
                        onValueChange={(o: Opportunity | null) => setSelected(o)}
                      />
                    </div>

                    {selected && (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <Typography
                              variant="caption"
                              textColor="muted-foreground"
                            >
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
                            <Typography
                              variant="caption"
                              textColor="muted-foreground"
                            >
                              Referral code (optional)
                            </Typography>
                            <Input
                              value={referrerCode}
                              onChange={(e) =>
                                setReferrerCode(e.target.value)
                              }
                              placeholder="e.g. BUILDER123"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setActiveStep(3)}
                      disabled={!isStep2Valid}
                    >
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
                      Please check your balance or enter a valid amount
                    </Typography>
                  )}
                </div>
              </StepperStep>

              {/* Step 3: Review & Approve */}
              <StepperStep step={3}>
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div
                      className="space-y-4 rounded-lg border border-border
                        bg-card/50 p-6"
                    >
                      <Typography variant="h6" family="head" weight="bold">
                        Transaction Summary
                      </Typography>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">{amount} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Target Protocol
                          </span>
                          <span className="font-medium">
                            {selected?.name || "Bridge"}
                          </span>
                        </div>
                        {selected && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Auto-Deploy
                              </span>
                              <span className="font-medium">
                                {autoDeploy ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Referral
                              </span>
                              <span className="font-medium">
                                {hasReferral ? referrerCode : "None"}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Estimated Time
                          </span>
                          <span className="font-medium">average 15 minutes</span>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <Typography
                          variant="caption"
                          textColor="muted-foreground"
                        >
                          Wallet: {effectiveEthAddress.slice(0, 6)}...
                          {effectiveEthAddress.slice(-4)}
                        </Typography>
                      </div>
                    </div>

                    {selected ? (
                      <RewardPreview
                        amount={amount}
                        autoDeploy={autoDeploy}
                        hasReferral={hasReferral}
                        userTotalBridged={0}
                        className="w-full"
                      />
                    ) : (
                      null
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(2)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (selected) {
                          mutation.mutate({
                            amount,
                            targetProtocol: selected.name,
                            autoDeploy,
                            referrerCode: hasReferral
                              ? referrerCode.trim()
                              : undefined,
                            ethAddress: effectiveEthAddress,
                            stacksAddress: effectiveStacksAddress,
                          })
                        } else {
                          handleSimpleBridge()
                        }
                      }}
                      disabled={mutation.isPending || isBridging}
                      size="lg"
                    >
                      {mutation.isPending || isBridging ? (
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

              {/* c: Confirm Bridge */}
              <StepperStep step={4}>
                <div className="space-y-6">
                  <div
                    className="rounded-lg border border-border bg-card/50 p-6"
                  >
                    <div
                      className="mb-6 flex items-center justify-between gap-3"
                    >
                      <Typography variant="h6" family="head" weight="bold">
                        Bridge Status
                      </Typography>
                      {requestId && (
                        <Typography
                          variant="caption"
                          textColor="muted-foreground"
                        >
                          ID: {requestId.slice(0, 8)}
                        </Typography>
                      )}
                    </div>

                    {!requestId ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Waiting for transaction initiation...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-3 md:grid-cols-3">
                          <StatusPill label="Initiated" status={currentStepApprove} />
                          <StatusPill label="Attesting" status={currentStepAttest} />
                          {selected && (
                            <StatusPill
                              label="Register on Stacks"
                              status={currentStepRegister}
                            />
                          )}
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                          {(statusQuery.data?.ethTxHash || approveTxHash || depositTxHash) && (
                            <>
                              <div
                                className="flex items-center justify-between
                                  text-sm"
                              >
                                <span className="text-muted-foreground">
                                  Ethereum Tx
                                </span>
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${statusQuery.data?.ethTxHash || depositTxHash || approveTxHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-primary
                                    hover:underline"
                                >
                                  {(statusQuery.data?.ethTxHash || depositTxHash || approveTxHash)?.slice(0, 18)}...
                                </a>
                              </div>
                              <Typography
                                variant="caption"
                                textColor="muted-foreground"
                                className="block text-center mt-2"
                              >
                                USDC will come after an average of 15 minutes.
                              </Typography>
                            </>
                          )}
                          {statusQuery.data?.stacksTxId && (
                            <div
                              className="flex items-center justify-between
                                text-sm"
                            >
                              <span className="text-muted-foreground">
                                . Stacks Tx
                              </span>
                              <a
                                href={`https://explorer.stacks.co/txid/${statusQuery.data.stacksTxId}?chain=testnet`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-primary
                                  hover:underline"
                              >
                                {statusQuery.data.stacksTxId.slice(0, 18)}...
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset form
                        setActiveStep(1)
                        setRequestId(null)
                        setAmountInput("1000")
                        setDepositInitiated(false) // Reset deposit initiated flag
                      }}
                    >
                      Start New Bridge
                    </Button>
                  </div>
                </div>
              </StepperStep>
            </StepperContent>
          </div>
        </div>
      </Stepper>
    </div>
  )
}
