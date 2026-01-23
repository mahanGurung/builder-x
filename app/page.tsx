"use client"
import React from "react"
import Link from "next/link"
import { Typography } from "@/components/global/typography"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Trophy, Zap, ShieldCheck, Coins } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
            B
          </div>
          <Typography variant="h5" family="head" className="font-bold tracking-tighter">
            Builder-X
          </Typography>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Typography
            render={<Link href="#features" />}
            variant="p2"
            family="body"
            weight="medium"
            className="transition-colors hover:text-primary"
          >
            Features
          </Typography>
          <Typography
            render={<Link href="#how-it-works" />}
            variant="p2"
            family="body"
            weight="medium"
            className="transition-colors hover:text-primary"
          >
            How it Works
          </Typography>
          <Typography
            render={<Link href="#leaderboard" />}
            variant="p2"
            family="body"
            weight="medium"
            className="transition-colors hover:text-primary"
          >
            Leaderboard
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <Button
            render={<Link href="#" />}
            variant="ghost"
            size="sm"
            textVariant={'caption'}
            className="hidden sm:inline-flex"
          >
            Documentation
          </Button>
          <Button
            render={<Link href="#" />}
            variant="default"
            textWeight={'bold'}
            size="lg"
            textVariant={'caption'}
            className="cursor-pointer"
          >
            Launch App
          </Button>
        </div>
      </div>
    </nav>
  )
}

const FeatureCard = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: React.ElementType
}) => (
  <Card className="group relative overflow-hidden border-border/50 bg-card/30 transition-all hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5">
    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
    <CardHeader>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <CardTitle>
        <Typography variant="h5" family="head" className="text-lg">
          {title}
        </Typography>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Typography variant="p2" family="body" className="text-muted-foreground">
        {description}
      </Typography>
    </CardContent>
  </Card>
)

const Page = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 md:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="container mx-auto flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            🏆 Participating in Programming USDCx on Stacks
          </Badge>

          <Typography
            variant="h1"
            family="head"
            className="mb-6 max-w-5xl text-5xl font-bold leading-none tracking-tight md:text-7xl lg:text-[5.5rem]"
          >
            Make Your Liquidity <br className="hidden md:block" />
            <span className="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Play & Earn
            </span>
          </Typography>

          <Typography
            variant="p1"
            family="body"
            className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Builder-X transforms boring USDC transfers into a profitable, gamified experience.
            Bridge from Ethereum to Stacks, earn completion rewards, and compete for yield multipliers.
          </Typography>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="#" className={buttonVariants({ size: "lg", className: "h-12 px-8 text-base shadow-lg shadow-primary/20" })}>
              Start Bridging Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="#" className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 px-8 text-base" })}>
              View Leaderboard
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-8 rounded-2xl border border-border/50 bg-muted/50 p-8 backdrop-blur sm:grid-cols-4">
            {[
              { label: "Total Value Locked", value: "$4.2M+" },
              { label: "Bridge Rewards", value: "125K STX" },
              { label: "Active Players", value: "3,400+" },
              { label: "Avg. Yield", value: "12.5%" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="text-2xl font-bold md:text-3xl">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="opacity-10" />

      {/* Value Prop / Problem-Solution */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <Typography variant="h2" family="head" className="mb-4">
              Why Just Bridge When You Can <span className="text-primary">Win?</span>
            </Typography>
            <Typography variant="p1" className="text-muted-foreground mx-auto max-w-2xl">
              Standard bridges are purely functional. Builder-X adds a layer of incentives and gamification
              to solve the cold start liquidity problem on Stacks.
            </Typography>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Gamified Transfers"
              description="Every deposit is a quest. Earn XP and mystery boxes for moving USDC to Stacks. Level up to reduce fees."
              icon={Trophy}
            />
            <FeatureCard
              title="Real-time Yield"
              description="Don't let assets sit idle. Your bridged USDCx starts earning yield immediately through our DeFi partners."
              icon={Coins}
            />
            <FeatureCard
              title="Seamless Bridge"
              description="Powered by Circle's xReserve protocol, ensuring 1:1 parity and military-grade security for your assets."
              icon={Zap}
            />
          </div>
        </div>
      </section>

      {/* How it Works / Technical */}
      <section id="how-it-works" className="bg-muted/30 py-24 px-4">
        <div className="container mx-auto">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-2">Powered by Circle xReserve</Badge>
                <Typography variant="h2" family="head" className="mb-4">
                  Trusted Infrastructure, <br />Gamified Experience
                </Typography>
                <Typography variant="p1" className="text-muted-foreground">
                  We rely on the robust USDCx on Stacks architecture. Deposits on Ethereum are automatically
                  attested and minted on Stacks, while withdrawals are securely burned and released.
                </Typography>
              </div>

              <div className="space-y-6">
                {[
                  { title: "Deposit USDC", desc: "Lock USDC on Ethereum via our smart contract interface." },
                  { title: "Mint & Reward", desc: "USDCx is minted on Stacks. You receive XP and an NFT badge." },
                  { title: "Play & Earn", desc: "Use USDCx in Stacks DeFi to climb the leaderboard and earn yield." },
                  { title: "Burn to Withdraw", desc: "Burn USDCx to redeem native USDC on Ethereum anytime." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl bg-card border p-2 shadow-2xl">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-purple-500 rounded-2xl opacity-20 blur-lg" />
              <div className="relative rounded-xl bg-background p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <Typography variant="h6">Bridge Transaction</Typography>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span>Ethereum Sepolia ➝ Stacks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>1,000.00 USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol</span>
                    <span>Circle xReserve</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-primary">
                    <span>Reward Earned</span>
                    <span>+500 XP (Rank Up!)</span>
                  </div>
                </div>
                <Button className="w-full mt-4">Confirm Deposit</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden border-2 border-primary/20 bg-linear-to-br from-primary/10 to-background">
            <CardHeader className="text-center py-16">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <Typography variant="h2" family="head" className="mb-4">
                Ready to bridge smarter?
              </Typography>
              <Typography variant="p1" className="text-muted-foreground max-w-xl mx-auto">
                Join thousands of users who are already earning rewards for their liquidity.
                Secure, fast, and actually fun.
              </Typography>
            </CardHeader>
            <CardContent className="flex justify-center pb-16">
              <Link href="#" className={buttonVariants({ size: "lg", className: "h-14 px-10 text-lg" })}>
                Launch Builder-X App
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground font-bold">
              B
            </div>
            <span className="font-bold text-lg tracking-tight">Builder-X</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for the Programming USDCx on Stacks Challenge. © 2026.
          </p>
          <div className="flex gap-6">
            <Button
              render={<Link href="#" />}
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Twitter
            </Button>
            <Button
              render={<Link href="#" />}
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Discord
            </Button>
            <Button
              render={<Link href="#" />}
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              GitHub
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Page
