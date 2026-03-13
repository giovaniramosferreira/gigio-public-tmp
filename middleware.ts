import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isAppRoute  = pathname.startsWith('/dashboard') ||
                      pathname.startsWith('/transactions') ||
                      pathname.startsWith('/upload')

  if (!session && isAppRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/upload/:path*', '/login', '/signup'],
}
