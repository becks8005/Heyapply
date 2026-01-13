import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// #region agent log: auth-handler-entry
const logAuthRequest = (method: string, path: string) => {
  fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:6',message:'Auth handler request',data:{method,path},timestamp:Date.now()})}).catch(()=>{})
}
// #endregion

export async function GET(req: NextRequest) {
  logAuthRequest('GET', req.url)
  try {
    const handler = handlers.GET
    if (!handler) {
      // #region agent log: auth-handler-missing
      fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:13',message:'GET handler missing',data:{},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      return NextResponse.json({ error: "Handler not found" }, { status: 500 })
    }
    const result = await handler(req)
    // #region agent log: auth-handler-success
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:18',message:'GET handler success',data:{status:result?.status||'unknown'},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return result
  } catch (error) {
    // #region agent log: auth-handler-error
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:22',message:'GET handler error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    console.error("Auth GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  logAuthRequest('POST', req.url)
  try {
    const handler = handlers.POST
    if (!handler) {
      // #region agent log: auth-handler-missing
      fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:33',message:'POST handler missing',data:{},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      return NextResponse.json({ error: "Handler not found" }, { status: 500 })
    }
    const result = await handler(req)
    // #region agent log: auth-handler-success
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:38',message:'POST handler success',data:{status:result?.status||'unknown'},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return result
  } catch (error) {
    // #region agent log: auth-handler-error
    fetch('http://127.0.0.1:7242/ingest/76ffc9c7-059e-4b32-88e6-f7831653fbdd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'auth-debug',hypothesisId:'B',location:'app/api/auth/[...nextauth]/route.ts:42',message:'POST handler error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    console.error("Auth POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

