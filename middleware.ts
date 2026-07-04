import { NextResponse, type NextRequest } from 'next/server'

const UNDER_CONSTRUCTION_PATH = '/under-construction'
const ADMIN_PREFIX = '/admin'

// Toggle the public maintenance page via env. Read at request time so flipping
// the var (Vercel env / .env.local) takes effect without a code change.
function isUnderConstruction(): boolean {
  return process.env.UNDER_CONSTRUCTION === 'true'
}

// Paths that stay reachable while the site is under construction: the
// construction page itself, API routes (Stripe webhook + token fulfillment
// must keep working), the Sanity Studio so content can still be edited, and the
// admin dashboard (its own Basic-Auth gate runs first, below).
function isAllowedDuringConstruction(pathname: string): boolean {
  return (
    pathname === UNDER_CONSTRUCTION_PATH ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith(ADMIN_PREFIX)
  )
}

// Length-safe, constant-time-ish string compare so the Basic-Auth check doesn't
// leak the password via early-exit timing. Edge runtime has no crypto.timingSafeEqual.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Spotless Admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}

// HTTP Basic Auth for the admin area. Fails CLOSED: if ADMIN_USER/ADMIN_PASSWORD
// aren't configured, no credentials can match, so /admin stays locked.
function isAuthorizedAdmin(request: NextRequest): boolean {
  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD
  if (!user || !pass) return false

  const header = request.headers.get('authorization') ?? ''
  const [scheme, encoded] = header.split(' ')
  if (scheme !== 'Basic' || !encoded) return false

  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return false
  }
  const sep = decoded.indexOf(':')
  if (sep < 0) return false

  const gotUser = decoded.slice(0, sep)
  const gotPass = decoded.slice(sep + 1)
  // Evaluate both halves regardless of the first result (no short-circuit).
  const okUser = safeEqual(gotUser, user)
  const okPass = safeEqual(gotPass, pass)
  return okUser && okPass
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)

  // Admin dashboard: Basic-Auth gated, independent of the construction flag so
  // it's reachable (and protected) whether or not the public site is live.
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!isAuthorizedAdmin(request)) return unauthorized()
    return NextResponse.next({ request: { headers } })
  }

  if (isUnderConstruction()) {
    // Flag the request so the root layout drops the normal nav/footer chrome.
    headers.set('x-under-construction', '1')

    if (!isAllowedDuringConstruction(pathname)) {
      // Rewrite (not redirect) so every page URL serves the construction page
      // while the address bar stays put. Rewrites don't re-trigger middleware,
      // so there's no loop.
      const url = request.nextUrl.clone()
      url.pathname = UNDER_CONSTRUCTION_PATH
      return NextResponse.rewrite(url, { request: { headers } })
    }
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|master-icon.png).*)'],
}
