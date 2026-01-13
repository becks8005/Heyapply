import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

// #region agent log: auth-config-start
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'A',location:'lib/auth.ts:9',message:'Auth config start',data:{hasAuthSecret:!!process.env.AUTH_SECRET,hasNextAuthSecret:!!process.env.NEXTAUTH_SECRET,secretLength:authSecret?.length||0,nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{})
// #endregion

// Wrap auth function to catch errors
let authFunction: typeof auth
let originalAuth: typeof auth

export const { handlers, auth: originalAuthFn, signIn, signOut } = NextAuth({
  // Note: PrismaAdapter removed - not needed with JWT strategy and can cause issues
  // adapter: PrismaAdapter(prisma), // REMOVED - causes issues with JWT strategy
  session: { strategy: "jwt" },
  secret: authSecret,
  trustHost: true, // Required for NextAuth v5 in development
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email und Passwort erforderlich")
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.passwordHash) {
          throw new Error("Ungültige Anmeldedaten")
        }
        
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        )
        
        if (!isValid) {
          throw new Error("Ungültige Anmeldedaten")
        }
        
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          image: user.profileImageUrl,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // #region agent log: jwt-callback-entry
      fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:61',message:'JWT callback entry',data:{hasUser:!!user,hasToken:!!token,trigger:trigger||'none',hasSession:!!session},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      try {
        if (user) {
          token.id = user.id
        }
        if (trigger === "update" && session) {
          token.name = session.name
          token.image = session.image
        }
        // #region agent log: jwt-callback-exit
        fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:70',message:'JWT callback exit',data:{tokenId:token.id,hasTokenId:!!token.id},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        return token
      } catch (error) {
        // #region agent log: jwt-callback-error
        fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:72',message:'JWT callback error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        throw error
      }
    },
    async session({ session, token }) {
      // #region agent log: session-callback-entry
      fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:85',message:'Session callback entry',data:{hasSession:!!session,hasToken:!!token,hasSessionUser:!!session?.user,hasTokenId:!!token?.id},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      try {
        if (session.user) {
          session.user.id = token.id as string
        }
        // #region agent log: session-callback-exit
        fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:90',message:'Session callback exit',data:{sessionUserId:session.user?.id,hasSessionUserId:!!session.user?.id},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        return session
      } catch (error) {
        // #region agent log: session-callback-error
        fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'D',location:'lib/auth.ts:92',message:'Session callback error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        throw error
      }
    }
  }
})

// Wrap auth() to add error logging
export const auth = async (...args: Parameters<typeof originalAuthFn>) => {
  // #region agent log: auth-function-call
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'E',location:'lib/auth.ts:95',message:'Auth function called',data:{argsCount:args.length},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  try {
    const result = await originalAuthFn(...args)
    // #region agent log: auth-function-success
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'E',location:'lib/auth.ts:100',message:'Auth function success',data:{hasSession:!!result,hasUser:!!result?.user,userId:result?.user?.id||'none'},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return result
  } catch (error) {
    // #region agent log: auth-function-error
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'E',location:'lib/auth.ts:105',message:'Auth function error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack?.substring(0,500):undefined},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    throw error
  }
}
