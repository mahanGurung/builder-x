"use client"

import { ArrowRight, Coins, ShieldCheck, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Typography } from "@/components/global/typography"
import { OpportunityScanner } from "@/components/opportunity/opportunity-scanner"

const Navbar = () => {
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border/40
        bg-background/80 backdrop-blur-md"
    >
      <div
        className="container mx-auto flex h-16 items-center justify-between px-4
          md:px-6"
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded
              bg-primary font-bold text-primary-foreground"
          >
            B
          </div>
          <Typography
            variant="h5"
            family="head"
            className="font-bold tracking-tighter"
          >
            Builder-X
          </Typography>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Typography
            render={<Link href="#opportunities" />}
            variant="p2"
            family="body"
            weight="medium"
            className="transition-colors hover:text-primary"
          >
            Yield Scanner
          </Typography>
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
            render={<Link href="#opportunities" />}
            variant="ghost"
            size="sm"
            textVariant={"caption"}
            className="hidden sm:inline-flex"
          >
            Documentation
          </Button>
          <Button
            render={<Link href="#opportunities" />}
            variant="default"
            textWeight={"bold"}
            size="lg"
            textVariant={"caption"}
            className="cursor-pointer"
          >
            View Opportunities
          </Button>
        </div>
      </div>
    </nav>
  )
}

const FeatureCard = ({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) => (
  <Card
    className="group relative overflow-hidden border-border/50 bg-card/30
      transition-all hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5"
  >
    <div
      className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/5
        blur-3xl transition-all group-hover:bg-primary/10"
    />
    <CardHeader>
      <div
        className="mb-4 inline-flex h-12 w-12 items-center justify-center
          rounded-lg bg-primary/10 text-primary"
      >
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
    <div
      className="min-h-screen bg-background text-foreground
        selection:bg-primary/20"
    >
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-20 pb-32 md:pt-32">
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
            🏆 Participating in Programming USDCx on Stacks
          </Badge>

          <Typography
            variant="h1"
            family="head"
            className="mb-6 max-w-5xl text-5xl leading-none font-bold
              tracking-tight md:text-7xl lg:text-[5.5rem]"
          >
            Make Your Liquidity <br className="hidden md:block" />
            <span
              className="bg-linear-to-r from-primary to-purple-400 bg-clip-text
                text-transparent"
            >
              Play & Earn
            </span>
          </Typography>

          <Typography
            variant="p1"
            family="body"
            className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Builder-X transforms stablecoin liquidity into a profitable,
            gamified experience. Earn rewards for activity, climb leaderboards,
            and discover the best on-chain yields in one place.
          </Typography>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="#opportunities"
              className={buttonVariants({
                size: "lg",
                className: "h-12 px-8 text-base shadow-lg shadow-primary/20",
              })}
            >
              Explore Opportunities <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="#"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "h-12 px-8 text-base",
              })}
            >
              View Leaderboard
            </Link>
          </div>

          {/* Stats Preview */}
          <div
            className="mt-20 grid w-full max-w-4xl grid-cols-2 gap-8 rounded-2xl
              border border-border/50 bg-muted/50 p-8 backdrop-blur
              sm:grid-cols-4"
          >
            {[
              { label: "Total Value Locked", value: "$4.2M+" },
              { label: "Rewards Distributed", value: "125K STX" },
              { label: "Active Players", value: "3,400+" },
              { label: "Avg. Yield", value: "12.5%" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="text-2xl font-bold md:text-3xl">
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider text-muted-foreground
                    uppercase"
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="opacity-10" />

      {/* Value Prop / Problem-Solution */}
      <section id="features" className="px-4 py-24">
        <div className="container mx-auto">
          <div className="mb-16 text-center">
            <Typography variant="h2" family="head" className="mb-4">
              Why Settle for Passive Liquidity?
            </Typography>
            <Typography
              variant="p1"
              className="mx-auto max-w-2xl text-muted-foreground"
            >
              Most cross-chain transfers are purely functional. Builder-X adds
              incentives and gamification to make liquidity deployment sticky
              and rewarding.
            </Typography>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Gamified Transfers"
              description="Every deposit is a quest. Earn XP and mystery boxes for routing liquidity across ecosystems. Level up to reduce fees."
              icon={Trophy}
            />
            <FeatureCard
              title="Real-time Yield"
              description="Don't let assets sit idle. Your stablecoins start earning curated DeFi yield as soon as they land."
              icon={Coins}
            />
            <FeatureCard
              title="Secure Infrastructure"
              description="Powered by battle-tested settlement rails and custody-grade security so your assets stay protected."
              icon={Zap}
            />
          </div>
        </div>
      </section>

      <Separator className="opacity-10" />

      {/* Opportunity Scanner Section */}
      <section id="opportunities" className="px-4 py-24">
        <div className="container mx-auto">
          <OpportunityScanner />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-4xl">
          <Card
            className="overflow-hidden border-2 border-primary/20
              bg-linear-to-br from-primary/10 to-background"
          >
            <CardHeader className="py-16 text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center
                  justify-center rounded-full bg-primary/20 text-primary"
              >
                <ShieldCheck className="h-8 w-8" />
              </div>
              <Typography variant="h2" family="head" className="mb-4">
                Ready to start earning?
              </Typography>
              <Typography
                variant="p1"
                className="mx-auto max-w-xl text-muted-foreground"
              >
                Join thousands of users who are already tracking on-chain yield
                and competing on the leaderboard.
              </Typography>
            </CardHeader>
            <CardContent className="flex justify-center pb-16">
              <Link
                href="#opportunities"
                className={buttonVariants({
                  size: "lg",
                  className: "h-14 px-10 text-lg",
                })}
              >
                Explore Yield Scanner
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
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
