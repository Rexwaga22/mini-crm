import { createClient } from '@/utils/supabase/server'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: profiles },
    { data: outcomeOptions },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*, profiles!leads_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'sales')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('response_outcomes')
      .select('label')
      .eq('is_active', true)
      .order('label'),
  ])

  return (
    <LeadsClient
      initialLeads={(leads as any) ?? []}
      reps={profiles ?? []}
      outcomeOptions={(outcomeOptions ?? []).map(o => o.label)}
    />
  )
}
