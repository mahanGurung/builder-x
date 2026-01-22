import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import React from "react"
import { cn } from "@/lib/utils"

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-[72px] leading-[1.1] tracking-tight",
      h2: "text-[64px] leading-[1.1] tracking-tight",
      h3: "text-[48px] leading-[1.1] tracking-tight",
      h4: "text-[32px] leading-[1.2] tracking-normal",
      h5: "text-[24px] leading-[1.2] tracking-normal",
      h6: "text-[20px] leading-[1.3] tracking-normal",
      p1: "text-[16px] leading-[1.3] tracking-normal",
      p2: "text-[14px] leading-[1.4] tracking-normal",
      caption: "text-[12px] leading-[1.4] tracking-normal",
    },
    family: {
      head: "font-head",
      body: "font-body",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    textColor: {
      default: "text-foreground",
      background: "text-background",
      foreground: "text-foreground",
      card: "text-card",
      "card-foreground": "text-card-foreground",
      popover: "text-popover",
      "popover-foreground": "text-popover-foreground",
      primary: "text-primary",
      "primary-foreground": "text-primary-foreground",
      secondary: "text-secondary",
      "secondary-foreground": "text-secondary-foreground",
      muted: "text-muted",
      "muted-foreground": "text-muted-foreground",
      accent: "text-accent",
      "accent-foreground": "text-accent-foreground",
      destructive: "text-destructive",
      border: "text-border",
      input: "text-input",
      ring: "text-ring",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
  },

  defaultVariants: {
    variant: "p1",
    family: "body",
    weight: "regular",
    textColor: "default",
    align: "left",
  },
})

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
  VariantProps<typeof typographyVariants> {
  render?: React.ReactElement
}

function Typography({
  className,
  variant,
  family,
  weight,
  textColor,
  align,
  render,
  ...props
}: TypographyProps) {
  const defaultElement =
    variant === "h1"
      ? "h1"
      : variant === "h2"
        ? "h2"
        : variant === "h3"
          ? "h3"
          : variant === "h4"
            ? "h4"
            : variant === "h5"
              ? "h5"
              : variant === "h6"
                ? "h6"
                : variant === "p1" || variant === "p2"
                  ? "p"
                  : variant === "caption"
                    ? "span"
                    : "p"

  return useRender({
    render: render || React.createElement(defaultElement),
    props: {
      ...props,
      className: cn(
        typographyVariants({ variant, family, weight, textColor, align }),
        className
      ),
    },
  })
}

export { Typography, typographyVariants }
