"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2, MoveRight, Shield, XCircle } from "lucide-react"
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
        "flex items-center gap-2 border px-3 py-2",
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
        <div className="h-4 w-4 border border-border" />
      )}
      <Typography variant="caption" weight="medium">
        {label}
      </Typography>
    </div>
  )
}

export function BridgeForm({ className }: { className?: string }) {
  const wallet = useDualWallet()

  const [amountInput, setAmountInput] = useState("1000")
  const [autoDeploy, setAutoDeploy] = useState(true)
  const [referrerCode, setReferrerCode] = useState("")
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)

  const amount = useMemo(() => parseAmount(amountInput), [amountInput])
  const hasReferral = referrerCode.trim().length > 0

  const effectiveEthAddress = wallet.ethAddress || DEMO_ETH_ADDRESS
  const effectiveStacksAddress = wallet.stacksAddress || DEMO_STACKS_ADDRESS

  const mutation = useMutation({
    mutationFn: initiateBridge,
    onSuccess: (res) => setRequestId(res.requestId),
  })

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
  const canSubmit = Boolean(selected) && amount > 0

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

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border bg-card/40 backdrop-blur",
        className
      )}
    >
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Typography variant="h5" family="head" weight="bold">
              Bridge USDC
            </Typography>
            <Typography variant="p2" textColor="muted-foreground">
              Ethereum (Sepolia) -&gt; Stacks (Testnet) via Circle xReserve
              (mock)
            </Typography>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <Typography variant="caption" weight="medium">
              Attested mint
            </Typography>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Typography variant="caption" textColor="muted-foreground">
                Amount (USDC)
              </Typography>
              <Input
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
              />
              <Typography variant="caption" textColor="muted-foreground">
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
              <Typography variant="caption" textColor="muted-foreground">
                Keeps USDCx earning without manual steps
              </Typography>
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
              <Typography variant="caption" textColor="muted-foreground">
                Adds +10% to you and referrer
              </Typography>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              textVariant="p2"
              textWeight="bold"
              onClick={() => {
                if (!selected) return

                mutation.mutate({
                  amount,
                  targetProtocol: selected.name,
                  autoDeploy,
                  referrerCode: hasReferral ? referrerCode.trim() : undefined,
                  ethAddress: effectiveEthAddress,
                  stacksAddress: effectiveStacksAddress,
                })
              }}
              disabled={!canSubmit || mutation.isPending}
              type="button"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initiating
                </>
              ) : (
                <>
                  Initiate Bridge
                  <MoveRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {!wallet.areBothConnected && (
              <Typography variant="caption" textColor="muted-foreground">
                Demo mode uses {DEMO_ETH_ADDRESS} and {DEMO_STACKS_ADDRESS}{" "}
                until you connect.
              </Typography>
            )}

            {mutation.error && (
              <Typography variant="caption" className="text-destructive">
                {(mutation.error as Error).message}
              </Typography>
            )}
          </div>

          {requestId && (
            <div className="space-y-2 border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <Typography variant="p2" family="head" weight="semibold">
                  Bridge Status
                </Typography>
                <Typography variant="caption" textColor="muted-foreground">
                  Request: {requestId.slice(0, 8)}
                </Typography>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <StatusPill label="Initiated" status={stepApprove} />
                <StatusPill label="Attesting" status={stepAttest} />
                <StatusPill label="Register on Stacks" status={stepRegister} />
              </div>

              {statusQuery.data?.ethTxHash && (
                <Typography variant="caption" textColor="muted-foreground">
                  Ethereum tx: {statusQuery.data.ethTxHash.slice(0, 18)}...
                </Typography>
              )}
              {statusQuery.data?.stacksTxId && (
                <Typography variant="caption" textColor="muted-foreground">
                  Stacks tx: {statusQuery.data.stacksTxId}
                </Typography>
              )}
            </div>
          )}
        </div>

        <RewardPreview
          amount={amount}
          autoDeploy={autoDeploy}
          hasReferral={hasReferral}
          userTotalBridged={0}
          className="self-start"
        />
      </div>
    </div>
  )
}
