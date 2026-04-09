import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import CreateOrderForm from './CreateOrderForm'

export const metadata: Metadata = {
  title: 'Nueva Orden | GRP Workspace',
  description: 'Crea una nueva orden de reparación para un cliente de tu taller.',
}

interface Customer {
  id: string
  full_name: string
}

/**
 * /dashboard/ordenes/nueva — Server Component.
 *
 * Fetches the workshop's customers list (RLS filters automatically by workshop_id)
 * and passes them down to the CreateOrderForm Client Component.
 */
export default async function NuevaOrdenPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name')
    .order('full_name', { ascending: true })

  const customersList: Customer[] = customers ?? []

  return <CreateOrderForm customers={customersList} />
}
