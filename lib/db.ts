import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from './generated/prisma'

// Create a singleton on dev to avoid multiple instances during hot reload
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: "file:prisma/dev.db",
  })

  return new PrismaClient({
    adapter,
  })
}

// Use existing instance or create a new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Only set global in non-production for hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
