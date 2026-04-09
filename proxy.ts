import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'


/**
 * Next.js 16 Proxy (formerly middleware).
 * Runs before every matched route. Responsibilities:
 *  1. Refresh Supabase session cookies.
 *  2. Redirect unauthenticated users away from /dashboard routes.
 *  3. Redirect authenticated users away from /login.
 *  4. Guard /admin-core — only the super-admin email is allowed.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // --- Route guards ---

  // ── Super-admin guard: /admin-core is private to one email ──────────────
  // Read env var at runtime to ensure Edge Runtime picks it up correctly.
  if (pathname.startsWith('/admin-core')) {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? ''
    if (!user) {
      // Not logged in — send to login and come back here after
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (user.email !== superAdminEmail) {
      // Logged in but not the super-admin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect all /dashboard/* routes
  if (pathname.startsWith('/dashboard') && !user) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination as a query param for post-login redirect
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from /login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Return the (possibly cookie-refreshed) response for all other routes
  return response
}

export const config = {
  matcher: [
    /*
     * Run proxy on every path EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico, sitemap.xml, robots.txt (metadata / public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
