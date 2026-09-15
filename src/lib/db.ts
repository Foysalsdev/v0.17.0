import { PrismaClient } from '@prisma/client'

/**
 * Prisma = LOCAL-mode only (SQLite file, scrypt users).
 *
 * Cloud (Supabase) mode — এবং Cloudflare Workers deploy — এটা কখনোই লোড
 * হয় না: PrismaClient-এর নেটিভ query engine Workers-এ চলে না, আর cloud
 * মোডে সব কুয়েরি supabase-js দিয়ে চলে। তাই instance-টা LAZY বানানো —
 * প্রথম property-access-এ তৈরি হয় (module import-এ নয়)।
 * store.ts-এর `db` cloud মোডে cloudDb — prisma-র কোনো ধরাছোঁয়া নেই।
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['error'] })
  }
  return globalForPrisma.prisma
}

/** Lazy proxy — `db.business` ধরা মাত্র PrismaClient তৈরি হয়। */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (prop === 'then' || typeof prop !== 'string') {
      // thenable-check ইত্যাদি — instance না বানিয়েই নেগেট করি
      return undefined as unknown as never
    }
    return Reflect.get(getPrisma(), prop) as unknown as never
  },
})

/** Alias (নতুন কোডে বোঝার সুবিধার জন্য) */
export const prisma: PrismaClient = db

export default db
