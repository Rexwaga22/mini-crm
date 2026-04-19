import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import SalesViewClient from './SalesViewClient'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'sales') redirect('/admin')

  // Fetch this rep's leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', user.id)
    .order('date_assigned', { ascending: false })

  // Fetch response outcome options
  const { data: outcomeOpts } = await supabase
    .from('response_outcomes')
    .select('label')
    .eq('is_active', true)
    .order('label')

  return (
    <div className="sales-shell">
      {/* Top Nav */}
      <nav className="topnav">
        <div className="topnav-brand">AGU CRM</div>
        <div className="topnav-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sidebar-avatar" style={{ width: 30, height: 30, fontSize: '0.6rem' }}>
              {profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <span style={{ fontSize: 'var(--font-body)', fontWeight: 500 }}>{profile.full_name}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="logout-btn">
              <LogOut size={15} /> Logout
            </button>
          </form>
        </div>
      </nav>

      <div className="sales-content">
        <h1 className="page-title" style={{ marginBottom: 'var(--space-6)' }}>Sales Dashboard</h1>
        <SalesViewClient
          leads={leads ?? []}
          outcomeOptions={(outcomeOpts ?? []).map(o => o.label)}
          repId={user.id}
        />
      </div>
    </div>
  )
}
