import { Typography } from "@/components/global/typography"
import BridgeFormLoader from "@/components/bridge/bridge-form-loader" // Import the new loader component

export const metadata = {
  title: "Bridge USDC | BuilderX",
  description: "Bridge USDC from Ethereum to Stacks and earn rewards.",
}

export const dynamic = 'force-dynamic'
export const revalidate = 0;

export default function BridgePage() {
  return (
    <div
      className="relative container mx-auto flex min-h-[calc(100vh-4rem)]
        flex-col items-center justify-center py-10"
    >
      <div className="mb-10 space-y-4 text-center">
        <Typography
          variant="h2"
          family="head"
          weight="bold"
          className="tracking-tight"
        >
          Bridge & Earn
        </Typography>
        <Typography
          variant="p1"
          textColor="muted-foreground"
          className="max-w-150"
        >
          Transfer USDC from Ethereum Sepolia to Stacks Testnet. Earn $BXR
          rewards and yield on your assets instantly.
        </Typography>
      </div>

      <BridgeFormLoader />
    </div>
  )
}
