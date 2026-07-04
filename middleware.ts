import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from './lib/adminAccess'

const UNDER_CONSTRUCTION_PATH = '/under-construction'
const ADMIN_PREFIX = '/admin'
const LOGIN_PATH = '/admin/login'
const AUTH_PREFIX = '/admin/auth' // magic-link callback — reachable without a session

// Toggle the public maintenance page via env. Read at request time so flipping
// the var (Vercel env / .env.local) takes effect without a code change.
function isUnderConstruction(): boolean {
  return process.env.UNDER_CONSTRUCTION === 'true'
}

// Paths that stay reachable while the site is under construction: the
// construction page itself, API routes (Stripe webhook + token fulfillment
// must keep working), the Sanity Studio, and the admin area (its own auth gate
// runs first, below).
function isAllowedDuringConstruction(pathname: string): boolean {
  return (
    pathname === UNDER_CONSTRUCTION_PATH ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith(ADMIN_PREFIX)
  )
}

// Admin area: require a Supabase session whose email is on the ADMIN_EMAILS
// allowlist. The login + magic-link callback stay public. Fails closed — if the
// public Supabase env isn't configured, every protected path bounces to login.
async function handleAdmin(request: NextRequest, requestHeaders: Headers) {
  const { pathname } = request.nextUrl
  const isPublicAdminPath = pathname === LOGIN_PATH || pathname.startsWith(AUTH_PREFIX)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  if (!url || !anonKey) {
    if (isPublicAdminPath) return response
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: requestHeaders } })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser() re-validates the JWT with Supabase (don't trust the cookie alone).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const authorized = !!user && isAdminEmail(user.email)

  if (isPublicAdminPath) {
    // Already signed in? Skip the login page and go to the dashboard.
    if (pathname === LOGIN_PATH && authorized) {
      return NextResponse.redirect(new URL('/admin/signups', request.url))
    }
    return response
  }

  if (!authorized) {
    const redirect = new URL(LOGIN_PATH, request.url)
    redirect.searchParams.set('next', pathname)
    return NextResponse.redirect(redirect)
  }

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  if (pathname.startsWith(ADMIN_PREFIX)) {
    return handleAdmin(request, requestHeaders)
  }

  if (isUnderConstruction()) {
    // Flag the request so the root layout drops the normal nav/footer chrome.
    requestHeaders.set('x-under-construction', '1')

    if (!isAllowedDuringConstruction(pathname)) {
      // Rewrite (not redirect) so every page URL serves the construction page
      // while the address bar stays put. Rewrites don't re-trigger middleware,
      // so there's no loop.
      const url = request.nextUrl.clone()
      url.pathname = UNDER_CONSTRUCTION_PATH
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|master-icon.png).*)'],
}
