import type { Metadata } from "next"
import { Sora, Syne } from "next/font/google"

import "./globals.css"

const syne = Syne({ subsets: ["latin"], variable: "--font-head" })

const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Builder-x",
  description: "Ethereum → Stacks liquidity",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${sora.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
