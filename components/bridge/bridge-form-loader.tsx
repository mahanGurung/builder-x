"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const EnhancedBridgeForm = dynamic(
  () => import("./enhanced-bridge-form").then(m => m.EnhancedBridgeForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export default function BridgeFormLoader() {
  return <EnhancedBridgeForm />;
}
