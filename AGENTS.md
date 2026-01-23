# AGENTS.md - Developer Guide for AI Coding Agents

This document provides essential guidelines for AI coding agents working on the Builder-X codebase.

---

## 📦 Build, Lint, and Test Commands

### Development

```bash
pnpm dev              # Start Next.js dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server
```

### Code Quality

```bash
pnpm lint             # Run ESLint on entire codebase
pnpm lint --fix       # Auto-fix ESLint issues
```

### Testing

```bash
# No test runner configured yet - tests should be added with Vitest or Jest
```

### Package Management

```bash
pnpm install          # Install dependencies (ONLY use pnpm, not npm/yarn)
pnpm add <package>    # Add dependency
pnpm add -D <package> # Add dev dependency
```

**IMPORTANT:** This project enforces pnpm usage. npm and yarn are blocked via preinstall hook.

---

## 🎨 Code Style Guidelines

### File Naming Conventions

**App Directory Files** (REQUIRED: KEBAB_CASE)

```
✅ app/user-profile/page.tsx
✅ app/dashboard/components/data-table.tsx
❌ app/UserProfile/page.tsx
❌ app/dashboard/components/DataTable.tsx
```

**Component Files** (No strict requirement outside app/)

```
✅ components/ui/button.tsx
✅ components/global/header.tsx
```

### Import Order (Auto-sorted by Prettier)

Imports MUST follow this exact order:

```typescript
// 1. React imports
import { useState } from "react"
// 2. Next.js imports
import Link from "next/link"
import { useRouter } from "next/navigation"
// 3. Type imports
import type { User } from "types"
// 4. @/types imports
import type { Config } from "@/types/config"
// 5. @/config imports
import { siteConfig } from "@/config/site"
// 6. @/lib imports
import { cn } from "@/lib/utils"
// 7. @/hooks imports
import { useUser } from "@/hooks/use-user"
// 8. @/components/ui imports
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
// 9. @/components imports
import { Header } from "@/components/global/header"
// 10. @/app imports
import { UserList } from "@/app/users/user-list"

// 11. Relative imports
import { helper } from "./helper"
import styles from "./styles.module.css"
```

### Import Restrictions (Enforced by ESLint)

**CRITICAL:** The following imports are FORBIDDEN:

```typescript
// ❌ NEVER import from app/ or features/ into shared code
// In components/, hooks/, lib/, types/, utils/:
import { Feature } from "@/features/user" // ❌ FORBIDDEN

// ✅ ALLOWED imports
import { cn } from "@/lib/utils" // ✅ OK
import { Button } from "@/components/ui/button" // ✅ OK
import { Something } from "@/app/dashboard" // ❌ FORBIDDEN
```

### Formatting Rules (Prettier)

```typescript
// ✅ Correct formatting
const greeting = "Hello" // Double quotes
const items = [1, 2, 3] // No semicolons
const obj = {
  // 2 space indentation
  name: "John", // Trailing commas (ES5)
}

// ❌ Incorrect
const greeting = "Hello" // Single quotes + semicolon
const items = [1, 2, 3] // No spaces
```

**Prettier Config Summary:**

- **No semicolons**
- **Double quotes** (not single)
- **2 space indentation**
- **80 character line width**
- **Trailing commas** (ES5 style)
- **Arrow function parens** always

---

## ⚛️ React & TypeScript Patterns

- favour named exports for components and all while default exports for `layout.tsx` and `page.tsx
-

### Component Definitions

**DO:**

```typescript
// ✅ Use function declarations
function Button({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button className={cn("base-styles", className)} {...props}>
      {children}
    </button>
  )
}

// ✅ Self-closing components (REQUIRED by ESLint)
<Button />
<Input />
<div className="empty" />
```

**DON'T:**

```typescript
// ❌ Avoid React.FC
const Button: React.FC<ButtonProps> = ({ children }) => { }

// ❌ Non-self-closing empty elements
<Button></Button>
<div className="empty"></div>
```

### Type Definitions

**Prefer `type` over `interface`:**

```typescript
// ✅ Preferred
type User = {
  id: string
  name: string
}

// ✅ For component props
type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "outline"
  size?: "sm" | "lg"
}

// ⚠️ Use interface only for extendable contracts
interface ApiClient {
  get: (url: string) => Promise<unknown>
  post: (url: string, data: unknown) => Promise<unknown>
}
```

---

## 🏗️ Architecture Patterns

### Component Structure

```
app/                    # Next.js app router pages
├── layout.tsx          # Root layout
├── page.tsx            # Home page
└── [feature]/          # Feature-specific pages
    ├── page.tsx
    └── components/     # Page-scoped components (KEBAB_CASE)

components/
├── ui/                 # Reusable UI primitives (shadcn-style)
└── global/             # Global shared components

lib/
└── utils.ts            # Utility functions (cn, etc.)

hooks/                  # Custom React hooks
types/                  # TypeScript type definitions
```

### Utility Function Usage

**Always use `cn()` for className merging:**

```typescript
import { cn } from "@/lib/utils"

// ✅ Correct
<div className={cn("base-class", conditional && "active", className)} />

// ❌ Don't manually concatenate
<div className={`base-class ${conditional ? "active" : ""} ${className}`} />
```

### Styling with Tailwind

```typescript
// ✅ Use custom functions with Prettier plugins
const buttonVariants = cva("base-styles", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: "border border-input bg-background",
    },
  },
})

// ✅ Multi-line class names (auto-formatted)
<div
  className={cn(
    "flex items-center justify-between rounded-lg border p-4",
    "hover:bg-accent hover:text-accent-foreground",
    className
  )}
/>
```

### Typography Component Usage

**CRITICAL: Always use the Typography component for text rendering**

The `Typography` component from `@/components/global/typography` MUST be used for ALL text content including:

- Headings (h1-h6)
- Paragraphs (p)
- Spans and inline text
- Text within buttons and links
- Any rendered text content

**DO:**

```typescript
import { Typography } from "@/components/global/typography"

// ✅ Use Typography for headings
<Typography variant="h1" family="head" weight="bold">
  Page Title
</Typography>

// ✅ Use Typography for paragraphs
<Typography variant="p1" textColor="muted-foreground">
  This is a paragraph with proper typography.
</Typography>

// ✅ Use Typography props directly on Button component
<Button
  variant="default"
  size="lg"
  textVariant="p2"
  textWeight="medium"
>
  Click Me
</Button>

// ✅ Button with Typography props and render prop for Link
<Button
  render={<Link href="/about" />}
  variant="ghost"
  textVariant="caption"
  textFamily="body"
>
  Learn More
</Button>

// ✅ Use Typography in links
<Link href="/about">
  <Typography variant="p1" textColor="primary">
    Learn More
  </Typography>
</Link>

// ✅ Use Typography with custom render element
<Typography variant="h3" family="head" render={<span />}>
  Custom Element
</Typography>
```

**DON'T:**

```typescript
// ❌ Never use raw HTML elements for text
<h1 className="text-4xl font-bold">Title</h1>

// ❌ Never manually add typography classes
<p className="text-[16px] leading-[1.3]">Content</p>

// ❌ Don't wrap Typography inside Button when you can use props
<Button>
  <Typography variant="p2" weight="medium">Click Me</Typography>
</Button>
```

**Typography Variants:**

- `h1, h2, h3, h4, h5, h6` - Headings (use `family="head"`)
- `p1, p2` - Paragraphs (use `family="body"`)
- `caption` - Small text/captions

**Available Props:**

- `variant` - Text size/style preset (required)
- `family` - Font family: "head" (Syne) or "body" (Sora)
- `weight` - Font weight: "regular", "medium", "semibold", "bold"
- `textColor` - Color from design system
- `align` - Text alignment: "left", "center", "right", "justify"
- `render` - Custom element to render (optional)

**Button Typography Props:**

When using the Button component, you can pass typography styling directly:

- `textVariant` - Same as Typography `variant` prop
- `textFamily` - Same as Typography `family` prop
- `textWeight` - Same as Typography `weight` prop
- `textAlign` - Same as Typography `align` prop

---

## 🔒 Error Handling & Type Safety

### Strict TypeScript

```typescript
// ✅ TypeScript strict mode is enabled
// All code must pass strict type checking

// ✅ Explicit return types for functions
function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

// ✅ Proper null handling
const user = await getUserById(id)
if (!user) {
  throw new Error("User not found")
}
```

### Async Error Handling

```typescript
// ✅ Server Components (app router)
async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)

  if (!user) {
    notFound() // Next.js built-in
  }

  return <div>{user.name}</div>
}

// ✅ Client Components
;("use client")

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Handle errors in useEffect or with error boundaries
}
```

---

## 🔄 Git Workflow

### Pre-commit Hooks (Husky + lint-staged)

**Automatic on commit:**

1. ESLint runs on all staged `.{js,jsx,ts,tsx}` files
2. Prettier formats all staged `.{json,md,css,yml}` files
3. Commit is blocked if errors exist

**To skip (emergency only):**

```bash
SKIP_LINT_STAGED=1 git commit -m "message"  # Not recommended
```

### Commit Best Practices

```bash
# ✅ Good commits
git commit -m "feat: add user profile page"
git commit -m "fix: resolve button hover state"
git commit -m "refactor: extract user table component"

# ✅ Use the commit helper
pnpm commit  # Interactive commit with commitizen
```

---

## 📚 Key Libraries & Patterns

- **Next.js 16.1.4** - App Router (Server Components by default)
- **React 19.2.3** - Latest React with new features
- **Tailwind CSS v4** - Utility-first styling
- **@base-ui/react** - Headless UI primitives
- **class-variance-authority** - Component variants (cva)
- **clsx + tailwind-merge** - Merged via `cn()` utility

### Font Configuration

```typescript
// Configured in app/layout.tsx
import { Sora, Syne } from "next/font/google"

const syne = Syne({ variable: "--font-head" }) // Headings
const sora = Sora({ variable: "--font-body" }) // Body text
```

---

## ⚡ Performance & Best Practices

1. **Use Server Components by default** - Only add `"use client"` when needed
2. **Optimize imports** - Import only what you need from large libraries
3. **Image optimization** - Always use `next/image` for images
4. **Font optimization** - Already configured with `next/font`
5. **Type safety** - Leverage TypeScript strict mode for better DX

---

## 🚨 Common Mistakes to Avoid

❌ Using npm or yarn instead of pnpm  
❌ PascalCase files in app/ directory  
❌ Wrong import order (Prettier will fix, but avoid manual mistakes)  
❌ Importing from app/ or features/ into shared code  
❌ Non-self-closing empty elements  
❌ Manual className concatenation instead of `cn()`  
❌ Using React.FC type annotation  
❌ Missing "use client" directive for client-side hooks

---

**Last Updated:** January 2026  
**Next.js Version:** 16.1.4  
**Package Manager:** pnpm >= 8.0.0
