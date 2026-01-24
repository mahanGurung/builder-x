"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Typography } from "@/components/global/typography"

export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border/40
        bg-background/80 backdrop-blur-md"
    >
      <div
        className="container mx-auto flex h-16 items-center justify-between px-4
          md:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Builder-X Home"
        >
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

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLinks />
        </div>

        {/* CTA & Mobile Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex">
            <Button
              render={<Link href="/bridge" />}
              variant="default"
              textWeight="bold"
              size="lg"
              textVariant="caption"
            >
              Bridge Now
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: "ghost", size: "icon" })}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    href="/#how-it-works"
                    className="flex w-full items-center"
                  >
                    How It Works
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    href="/#opportunities"
                    className="flex w-full items-center"
                  >
                    Scanner
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="/#rewards" className="flex w-full items-center">
                    Rewards
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-bold text-primary"
                >
                  <Link href="/bridge" className="flex w-full items-center">
                    Bridge Now
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLinks() {
  return (
    <>
      <Typography
        render={<Link href="/#how-it-works" />}
        variant="p2"
        family="body"
        weight="medium"
        className="transition-colors hover:text-primary"
      >
        How It Works
      </Typography>
      <Typography
        render={<Link href="/#opportunities" />}
        variant="p2"
        family="body"
        weight="medium"
        className="transition-colors hover:text-primary"
      >
        Scanner
      </Typography>
      <Typography
        render={<Link href="/#rewards" />}
        variant="p2"
        family="body"
        weight="medium"
        className="transition-colors hover:text-primary"
      >
        Rewards
      </Typography>
    </>
  )
}
