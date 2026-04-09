import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

export interface UpdateSessionResult {
  response: NextResponse
  user: User | null
}

/**
 * Refreshes the Supabase session cookie on every request and returns
 * the updated NextResponse together with the current user (or null).
 *
 * Call this from proxy.ts so cookies are refreshed before route guards run.
 */
export async function updateSession(
  request: NextRequest
): Promise<UpdateSessionResult> {
  // Start with a pass-through response; cookies will be written onto it.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Reflect new cookies onto the outgoing request for downstream code…
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // …and onto the response so the browser keeps the refreshed session.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT add any logic between createServerClient and getUser().
  // A subtle ordering bug here can silently log users out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
