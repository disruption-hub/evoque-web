import { PrismaClient } from '@evoque/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Skip adapter initialization if on client side
  if (typeof window !== 'undefined') {
    throw new Error('Prisma Client should not be used on the client side. Use API routes instead.')
  }

  const connectionString = process.env.DATABASE_URL

  // During build time, we may not have DATABASE_URL
  // For Prisma 7, we need to provide either adapter or accelerateUrl
  // Use a dummy connection string during build if DATABASE_URL is not available
  const dbUrl = connectionString || 'postgresql://dummy:dummy@localhost:5432/dummy'

  try {
    // Create pool with the connection string (will work even with dummy URL for initialization)
    const pool = new Pool({ 
      connectionString: dbUrl,
      // Set connection timeout to 0 during build to prevent hanging
      connectionTimeoutMillis: 0,
    })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    // If pool/adapter creation fails during build, try without adapter (will error at runtime)
    console.warn('Failed to create Prisma adapter during initialization:', error)
    // For build-time, create a minimal client - this will need proper adapter at runtime
    try {
      const pool = new Pool({ connectionString: dbUrl })
      const adapter = new PrismaPg(pool)
      return new PrismaClient({
        adapter,
        log: ['error'],
      })
    } catch {
      // Last resort: create client without adapter (Prisma 7 requires one, so this will fail)
      // But at least it won't crash the build
      throw new Error('Prisma Client initialization failed. DATABASE_URL may be required.')
    }
  }
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
