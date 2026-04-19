import { createClient } from '@/utils/supabase/server'
import AssignmentClient from './AssignmentClient'

export default async function AssignmentPage() {
  const supabase = await createClient()

  const [
    { count: unassignedCount },
    { data: unassignedLeads },
    { data: reps },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).is('assigned_to', null),
    supabase.from('leads').select('id').is('assigned_to', null),
    supabase
      .from('profiles')
      .select('id, full_name, capacity')
      .eq('role', 'sales')
      .eq('is_active', true)
      .order('full_name'),
  ])

  // Get current lead count per rep
  const repStats = await Promise.all(
    (reps ?? []).map(async (rep: any) => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', rep.id)
      return { ...rep, currentLeads: count ?? 0 }
    })
  )

  // Calculate even-split distribution
  const totalUnassigned = unassignedCount ?? 0
  const activeReps = repStats.filter(r => r.currentLeads < r.capacity)
  const baseShare = activeReps.length > 0 ? Math.floor(totalUnassigned / activeReps.length) : 0
  const remainder = activeReps.length > 0 ? totalUnassigned % activeReps.length : 0

  const distribution = repStats.map((rep, i) => {
    const activeIndex = activeReps.findIndex(r => r.id === rep.id)
    if (activeIndex === -1) return { ...rep, leadsToReceive: 0 }
    const leadsToReceive = baseShare + (activeIndex < remainder ? 1 : 0)
    const capped = Math.min(leadsToReceive, rep.capacity - rep.currentLeads)
    return { ...rep, leadsToReceive: capped }
  })

  return (
    <AssignmentClient
      unassignedCount={totalUnassigned}
      unassignedLeadIds={(unassignedLeads ?? []).map(l => l.id)}
      distribution={distribution}
      repCount={activeReps.length}
    />
  )
}
