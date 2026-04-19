import { createClient } from '@/utils/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()

  const [
    { data: reps },
    { data: outcomes },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, capacity, is_active, created_at')
      .order('full_name'),
    supabase
      .from('response_outcomes')
      .select('*')
      .order('label'),
    supabase
      .from('system_settings')
      .select('key, value'),
  ])

  const inactivityThreshold = settings?.find(s => s.key === 'inactivity_threshold_days')?.value ?? '2'

  return (
    <SettingsClient
      users={reps ?? []}
      outcomes={outcomes ?? []}
      inactivityThreshold={parseInt(inactivityThreshold)}
    />
  )
}
