/**
 * Shared per-request cached queries.
 *
 * React.cache() memoizes the result for the duration of a single server
 * render pass. Any component (layout, page, etc.) that calls one of these
 * functions during the same request will receive the same promise — no extra
 * network round-trips to Supabase.
 *
 * Docs: https://react.dev/reference/react/cache
 */
import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

/**
 * Returns the currently authenticated Supabase user.
 * Cached for the lifetime of the current request.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Returns the profile row (including workshop_id) for the given user id.
 * Cached per (userId) for the lifetime of the current request.
 */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, full_name, role')
    .eq('id', userId)
    .single()
  return profile
})

/**
 * Convenience helper: resolves user + profile in parallel and returns
 * both together with the workshopId already extracted.
 */
export const getUserContext = cache(async () => {
  const user = await getUser()
  if (!user) return { user: null, profile: null, workshopId: '' }

  const profile = await getProfile(user.id)
  return {
    user,
    profile,
    workshopId: profile?.workshop_id ?? '',
  }
})
