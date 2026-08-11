import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Clone-proofing: lista de domínios autorizados ────────────────────────────
// Configure ALLOWED_HOSTS no ambiente de produção (ex: "poup.com.br,www.poup.com.br")
// Em desenvolvimento, qualquer host local é permitido.
function isAuthorizedHost(req: NextRequest): boolean {
  const allowedHostsEnv = process.env.ALLOWED_HOSTS
  if (!allowedHostsEnv) return true  // não configurado → sem restrição (útil em dev)

  const allowedHosts = allowedHostsEnv.split(',').map(h => h.trim().toLowerCase())
  const requestHost  = req.headers.get('host')?.toLowerCase() ?? ''

  // Sempre permite localhost e Vercel preview URLs
  if (requestHost.includes('localhost') || requestHost.includes('127.0.0.1')) return true
  if (requestHost.endsWith('.vercel.app')) return true

  return allowedHosts.some(allowed => requestHost === allowed || requestHost.endsWith(`.${allowed}`))
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ── Rejeita hosts não autorizados (clone-proofing) ──────────────────────
  if (!isAuthorizedHost(req)) {
    return new NextResponse(
      JSON.stringify({ error: 'Domínio não autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createMiddlewareClient({ req, res })

  // getSession() é seguro no middleware — o client de middleware faz refresh do cookie
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isAppRoute  = pathname.startsWith('/dashboard') ||
                      pathname.startsWith('/transactions') ||
                      pathname.startsWith('/upload') ||
                      pathname.startsWith('/historia')

  if (!session && isAppRoute) {
    const loginUrl = new URL('/login', req.url)
    // Não preserva `next` para evitar open redirect
    return NextResponse.redirect(loginUrl)
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/upload/:path*', '/historia/:path*', '/historia', '/login', '/signup'],
}
