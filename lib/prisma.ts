import { PrismaClient } from "@prisma/client"

// #region agent log: prisma-init-start
fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-prisma',hypothesisId:'A',location:'lib/prisma.ts:5',message:'Prisma init start',data:{nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{})
// #endregion

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// #region agent log: prisma-init-created
fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'build-prisma',hypothesisId:'A',location:'lib/prisma.ts:12',message:'Prisma client created',data:{cached:!!globalForPrisma.prisma},timestamp:Date.now()})}).catch(()=>{})
// #endregion

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
