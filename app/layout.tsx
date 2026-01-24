import type { Metadata } from "next"
import { Sora, Syne } from "next/font/google"
import { Navbar } from "@/components/global/navbar"

import { Providers } from "./providers"

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
      <body className="antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50
              focus:bg-background focus:p-4 focus:text-foreground"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
