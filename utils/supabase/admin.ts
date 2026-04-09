import { createClient } from '@supabase/supabase-js'

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  ADVERTENCIA DE SEGURIDAD — LEER ANTES DE USAR                 ║
 * ║                                                                      ║
 * ║  Este cliente usa la SERVICE_ROLE_KEY de Supabase, que BYPASEA      ║
 * ║  completamente el Row Level Security (RLS).                          ║
 * ║                                                                      ║
 * ║  REGLAS OBLIGATORIAS:                                               ║
 * ║  1. NUNCA importar este archivo en componentes 'use client'.        ║
 * ║  2. NUNCA exponer supabaseAdmin al browser/frontend de ninguna forma.║
 * ║  3. Úsalo SOLO en Server Actions o Route Handlers de confianza.     ║
 * ║  4. Cada operación debe validar manualmente permisos y workshop_id. ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('[supabaseAdmin] NEXT_PUBLIC_SUPABASE_URL is not set')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // Disable automatic token refresh — this client is server-only,
      // session persistence is not needed.
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
