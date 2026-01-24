"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import type {
  BridgeInitiateRequest,
  BridgeInitiateResponse,
  BridgeStatusResponse,
} from "@/types/bridge"
import type { Opportunity } from "@/types/opportunity"
import { cn } from "@/lib/utils"
import { useDualWallet } from "@/hooks/wallet/use-dual-wallet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
} from "@/components/ui/stepper"
import { ProtocolSelector } from "@/components/bridge/protocol-selector"
import { RewardPreview } from "@/components/bridge/reward-preview"
import { WalletPanel } from "@/components/bridge/wallet-panel"
import { Typography } from "@/components/global/typography"

const DEMO_ETH_ADDRESS = "0x0A5728c5953634f9b9F132843bdE1B593Ce174Bb"
const DEMO_STACKS_ADDRESS = "ST1M33KB90FAQYD26MHPQGJ13HEGKFYWNAQMCKEBR"

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

  // State
  const [amountInput, setAmountInput] = useState("1000")
  const [autoDeploy, setAutoDeploy] = useState(true)
  const [referrerCode, setReferrerCode] = useState("")
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  const amount = useMemo(() => parseAmount(amountInput), [amountInput])
  const hasReferral = referrerCode.trim().length > 0

  const effectiveEthAddress = wallet.ethAddress || DEMO_ETH_ADDRESS
  const effectiveStacksAddress = wallet.stacksAddress || DEMO_STACKS_ADDRESS

  // Mutations
  const mutation = useMutation({
    mutationFn: initiateBridge,
    onSuccess: (res) => {
      setRequestId(res.requestId)
      // Automatically move to the next step (Confirm Bridge)
      // setActiveStep(3) // Note: Controlled stepper logic might be needed
    },
  })

  // Queries
  const statusQuery = useQuery({
    queryKey: ["bridge-status", requestId],
    queryFn: () => fetchStatus(requestId as string),
    enabled: Boolean(requestId),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      if (!s) return 1_000
      return s === "registered" || s === "failed" ? false : 1_000
    },
  })

  const status = statusQuery.data?.status || (requestId ? "initiated" : null)

  // Status mapping
  const stepApprove = status ? "done" : "pending"
  const stepAttest =
    status === "attesting"
      ? "active"
      : status === "registered"
        ? "done"
        : status === "failed"
          ? "error"
          : "pending"
  const stepRegister =
    status === "registered"
      ? "done"
      : status === "failed"
        ? "error"
        : status === "initiated" || status === "attesting"
          ? "active"
          : "pending"

  // Step Validation
  const isStep1Valid = wallet.isEthConnected && wallet.isStacksConnected
  const isStep2Valid = Boolean(selected) && amount > 0
  const isStep3Valid = true // Review step is always valid to proceed if previous are valid

  const steps = [
    {
      id: "step-1",
      title: "Connect Wallets",
      description: "Connect both Ethereum and Stacks wallets",
    },
    {
      id: "step-2",
      title: "Bridge Details",
      description: "Enter amount and select target protocol",
    },
    {
      id: "step-3",
      title: "Review & Approve",
      description: "Verify details and approve transaction",
    },
    {
      id: "step-4",
      title: "Confirm Bridge",
      description: "Monitor bridge progress",
    },
  ]

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <Stepper
        orientation="vertical"
        defaultValue="step-1"
        className="flex w-full flex-col gap-6"
        value={steps[activeStep].id}
        onValueChange={(val) => {
          const index = steps.findIndex((s) => s.id === val)
          if (index !== -1) setActiveStep(index)
        }}
      >
        {steps.map((step, index) => (
          <StepperItem
            key={step.id}
            value={step.id}
            className="flex-col items-start gap-4 border-l-[2px] border-l-border
              pl-6 transition-all data-[state=active]:border-l-primary
              data-[state=completed]:border-l-primary/50"
          >
            <div className="flex items-center gap-4">
              <StepperIndicator className="absolute -left-[15px] bg-background">
                <span className="text-sm font-bold">{index + 1}</span>
              </StepperIndicator>
              <div className="flex flex-col">
                <StepperTitle asChild>
                  <Typography variant="p2" weight="bold">
                    {step.title}
                  </Typography>
                </StepperTitle>
                <StepperDescription asChild>
                  <Typography variant="caption" textColor="muted-foreground">
                    {step.description}
                  </Typography>
                </StepperDescription>
              </div>
            </div>

            <StepperContent value={step.id} className="w-full pt-4 pb-8">
              {/* Step 1: Connect Wallets */}
              {index === 0 && (
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
                      onClick={() => setActiveStep(1)}
                      // disabled={!isStep1Valid}
                      // Allow proceeding for demo purposes even if not connected, but show warning
                      // Ideally should be disabled: disabled={!isStep1Valid}
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
                      Demo mode enabled if not connected
                    </Typography>
                  )}
                </div>
              )}

              {/* Step 2: Bridge Details */}
              {index === 1 && (
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
                        <Input
                          inputMode="decimal"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          placeholder="0.00"
                        />
                        <Typography
                          variant="caption"
                          textColor="muted-foreground"
                        >
                          Rewards vest linearly over ~90 days
                        </Typography>
                      </div>

                      <ProtocolSelector
                        value={selected?.name ?? null}
                        onValueChange={(o: Opportunity) => setSelected(o)}
                      />
                    </div>

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
                          onChange={(e) => setReferrerCode(e.target.value)}
                          placeholder="e.g. BUILDER123"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(0)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setActiveStep(2)}
                      disabled={!isStep2Valid}
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Approve */}
              {index === 2 && (
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
                            {selected?.name || "None"}
                          </span>
                        </div>
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

                    <RewardPreview
                      amount={amount}
                      autoDeploy={autoDeploy}
                      hasReferral={hasReferral}
                      userTotalBridged={0}
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        mutation.mutate({
                          amount,
                          targetProtocol: selected!.name,
                          autoDeploy,
                          referrerCode: hasReferral
                            ? referrerCode.trim()
                            : undefined,
                          ethAddress: effectiveEthAddress,
                          stacksAddress: effectiveStacksAddress,
                        })
                        setActiveStep(3)
                      }}
                      disabled={mutation.isPending}
                      size="lg"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Initiating...
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
              )}

              {/* Step 4: Confirm Bridge */}
              {index === 3 && (
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
                          <StatusPill label="Initiated" status={stepApprove} />
                          <StatusPill label="Attesting" status={stepAttest} />
                          <StatusPill
                            label="Register on Stacks"
                            status={stepRegister}
                          />
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                          {statusQuery.data?.ethTxHash && (
                            <div
                              className="flex items-center justify-between
                                text-sm"
                            >
                              <span className="text-muted-foreground">
                                Ethereum Tx
                              </span>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${statusQuery.data.ethTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-primary
                                  hover:underline"
                              >
                                {statusQuery.data.ethTxHash.slice(0, 18)}...
                              </a>
                            </div>
                          )}
                          {statusQuery.data?.stacksTxId && (
                            <div
                              className="flex items-center justify-between
                                text-sm"
                            >
                              <span className="text-muted-foreground">
                                Stacks Tx
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
                        setActiveStep(0)
                        setRequestId(null)
                        setAmountInput("1000")
                      }}
                    >
                      Start New Bridge
                    </Button>
                  </div>
                </div>
              )}
            </StepperContent>
          </StepperItem>
        ))}
      </Stepper>
    </div>
  )
}
