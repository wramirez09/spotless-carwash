import { NextResponse, type NextRequest } from 'next/server'

const UNDER_CONSTRUCTION_PATH = '/under-construction'

// Toggle the public maintenance page via env. Read at request time so flipping
// the var (Vercel env / .env.local) takes effect without a code change.
function isUnderConstruction(): boolean {
  return process.env.UNDER_CONSTRUCTION === 'true'
}

// Paths that stay reachable while the site is under construction: the
// construction page itself, API routes (Stripe webhook + token fulfillment
// must keep working), and the Sanity Studio so content can still be edited.
function isAllowedDuringConstruction(pathname: string): boolean {
  return (
    pathname === UNDER_CONSTRUCTION_PATH ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/studio')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)

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
