"use client"

import { ArrowRight, Box, Layers, ShieldCheck, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Typography } from "@/components/global/typography"
import { OpportunityScanner } from "@/components/opportunity/opportunity-scanner"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden px-4 pt-16 pb-24 md:pt-24 md:pb-32"
      >
        <div
          className="absolute inset-0 -z-10
            bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))]
            from-primary/10 via-background to-background"
        />

        <div
          className="container mx-auto flex flex-col items-center text-center"
        >
          <Badge
            variant="secondary"
            className="mb-6 rounded-full border border-primary/20 bg-primary/5
              px-4 py-1.5 text-sm text-primary"
          >
            🏆 Programming USDCx on Stacks
          </Badge>

          <Typography
            variant="h1"
            family="head"
            className="mb-6 max-w-4xl text-5xl leading-tight font-bold
              tracking-tight md:text-7xl"
          >
            The Incentivized <br className="hidden md:block" />
            <span
              className="bg-gradient-to-r from-primary to-purple-400
                bg-clip-text text-transparent"
            >
              Bridge Aggregator
            </span>
          </Typography>

          <Typography
            variant="p1"
            family="body"
            className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Bridge USDC from Ethereum to Stacks securely via Circle xReserve.
            Earn $BXR rewards, maximize yield with auto-deploy, and climb the
            leaderboard.
          </Typography>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              render={<Link href="/bridge" />}
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/20"
              textWeight="bold"
            >
              Bridge Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              render={<Link href="#opportunities" />}
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
            >
              View Opportunities
            </Button>
          </div>

          {/* Key Metrics / Trust Bar */}
          <div
            className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-8 rounded-2xl
              border border-border/50 bg-muted/50 p-8 backdrop-blur
              md:grid-cols-4"
          >
            <div className="flex flex-col gap-1">
              <Typography variant="h4" family="head" weight="bold">
                0.75%
              </Typography>
              <Typography
                variant="caption"
                textColor="muted-foreground"
                className="tracking-wider uppercase"
              >
                Base Rewards
              </Typography>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="h4" family="head" weight="bold">
                +30%
              </Typography>
              <Typography
                variant="caption"
                textColor="muted-foreground"
                className="tracking-wider uppercase"
              >
                Auto-Deploy Bonus
              </Typography>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="h4" family="head" weight="bold">
                90 Days
              </Typography>
              <Typography
                variant="caption"
                textColor="muted-foreground"
                className="tracking-wider uppercase"
              >
                Vesting Schedule
              </Typography>
            </div>
            <div className="flex flex-col gap-1">
              <Typography variant="h4" family="head" weight="bold">
                3.0x
              </Typography>
              <Typography
                variant="caption"
                textColor="muted-foreground"
                className="tracking-wider uppercase"
              >
                Max Multiplier
              </Typography>
            </div>
          </div>
        </div>
      </section>

      <Separator className="opacity-10" />

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-16 px-4 py-24">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <Typography variant="h2" family="head" className="mb-4">
              How It Works
            </Typography>
            <Typography
              variant="p1"
              className="mx-auto max-w-2xl text-muted-foreground"
            >
              A seamless flow from Ethereum to Stacks yield, fully incentivized.
            </Typography>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              number="01"
              title="Connect"
              description="Connect your MetaMask (Ethereum) and Leather (Stacks) wallets."
              icon={ShieldCheck}
            />
            <StepCard
              number="02"
              title="Select Yield"
              description="Choose a Stacks protocol for auto-deployment to earn immediate yield."
              icon={TrendingUp}
            />
            <StepCard
              number="03"
              title="Bridge"
              description="Transfer USDC via Circle xReserve with a single secure transaction."
              icon={Layers}
            />
            <StepCard
              number="04"
              title="Earn"
              description="Receive $BXR rewards, track your vesting, and climb the leaderboard."
              icon={Box}
            />
          </div>
        </div>
      </section>

      <Separator className="opacity-10" />

      {/* Opportunity Scanner Section */}
      <section
        id="opportunities"
        className="scroll-mt-16 bg-muted/30 px-4 py-24"
      >
        <div className="container mx-auto">
          <OpportunityScanner />
        </div>
      </section>

      {/* Rewards & Leaderboard Teaser */}
      <section id="rewards" className="scroll-mt-16 px-4 py-24">
        <div className="container mx-auto max-w-4xl text-center">
          <Typography variant="h2" family="head" className="mb-6">
            Compete & Earn More
          </Typography>
          <Typography
            variant="p1"
            className="mx-auto mb-12 max-w-2xl text-muted-foreground"
          >
            Builder-X isn&apos;t just a bridge; it&apos;s a game. Increase your
            volume to unlock multiplier tiers up to 3x, and refer friends for a
            10% bonus for both of you.
          </Typography>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/50 text-left">
              <CardHeader>
                <CardTitle>Volume Multipliers</CardTitle>
                <CardDescription>
                  Boost your rewards by bridging more volume.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex justify-between border-b border-border/50
                    pb-2"
                >
                  <span className="text-sm">Tier 1 ($0 - $1k)</span>
                  <span className="font-bold text-primary">1.0x</span>
                </div>
                <div
                  className="flex justify-between border-b border-border/50
                    pb-2"
                >
                  <span className="text-sm">Tier 2 ($1k - $10k)</span>
                  <span className="font-bold text-primary">1.5x</span>
                </div>
                <div
                  className="flex justify-between border-b border-border/50
                    pb-2"
                >
                  <span className="text-sm">Tier 3 ($10k - $50k)</span>
                  <span className="font-bold text-primary">2.0x</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-sm">Tier 4 ($50k+)</span>
                  <span className="font-bold text-primary">3.0x</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 text-left">
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>
                  Grow the network, grow your rewards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-primary/10 p-4">
                  <Typography
                    variant="h4"
                    family="head"
                    weight="bold"
                    className="text-primary"
                  >
                    +10% Bonus
                  </Typography>
                  <Typography variant="caption" textColor="muted-foreground">
                    For both referrer and referee
                  </Typography>
                </div>
                <Typography variant="p2" textColor="muted-foreground">
                  Generate your unique code in the dashboard and share it.
                  Referral bonuses are added to your vesting schedule
                  automatically.
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <Card
            className="overflow-hidden border-2 border-primary/20
              bg-gradient-to-br from-primary/10 to-background"
          >
            <CardHeader className="py-16 text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center
                  justify-center rounded-full bg-primary/20 text-primary"
              >
                <ShieldCheck className="h-8 w-8" />
              </div>
              <Typography variant="h2" family="head" className="mb-4">
                Ready to Bridge?
              </Typography>
              <Typography
                variant="p1"
                className="mx-auto max-w-xl text-muted-foreground"
              >
                Start earning yield and $BXR rewards on Stacks today.
              </Typography>
            </CardHeader>
            <CardContent className="flex justify-center pb-16">
              <Button
                render={<Link href="/bridge" />}
                size="lg"
                className="h-14 px-10 text-lg"
              >
                Start Bridging Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background py-12">
        <div
          className="container mx-auto flex flex-col items-center
            justify-between gap-6 px-4 md:flex-row"
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded
                bg-primary text-[10px] font-bold text-primary-foreground"
            >
              B
            </div>
            <span className="text-lg font-bold tracking-tight">Builder-X</span>
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
              GitHub
            </Button>
            <Button
              render={<Link href="#" />}
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Documentation
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Card
      className="group relative overflow-hidden transition-[transform,shadow]
        hover:-translate-y-1 hover:shadow-lg"
    >
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg
              bg-primary/10 text-primary transition-colors
              group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-4xl font-bold text-muted/20">{number}</span>
        </div>
        <CardTitle>
          <Typography variant="h5" family="head">
            {title}
          </Typography>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Typography variant="p2" className="text-muted-foreground">
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}
