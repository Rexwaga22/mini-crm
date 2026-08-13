import { createClient } from '@/utils/supabase/server'
import { getCryptoMovers } from '@/lib/cryptoApi'
import { getForexMovers } from '@/lib/forexApi'
import MoversCard from '@/components/markets/MoversCard'
import { Globe, UserX, MessageSquare, Timer, AlertTriangle, TrendingUp, Users, Bitcoin, Landmark } from 'lucide-react'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // ── Stat Counts ──
  const [
    { count: totalLeads },
    { count: unassigned },
    { count: contacted },
    { count: awaitingResponse },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).is('assigned_to', null),
    supabase.from('leads').select('*', { count: 'exact', head: true }).neq('contact_status', 'Not Yet Contacted'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('contact_status', 'Callback Scheduled'),
  ])

  // ── Market Movers ──
  const [cryptoMoversRaw, forexMovers] = await Promise.all([
    getCryptoMovers().catch(() => null),
    getForexMovers().catch(() => null),
  ])

  const cryptoMovers = cryptoMoversRaw && {
    gainers: cryptoMoversRaw.gainers.map(({ symbol, name, price, changePercent24h }) => ({ symbol, name, price, changePercent: changePercent24h })),
    losers: cryptoMoversRaw.losers.map(({ symbol, name, price, changePercent24h }) => ({ symbol, name, price, changePercent: changePercent24h })),
  }

  // ── Inactivity Report ──
  const { data: inactivityReport } = await supabase.rpc('get_inactivity_report')

  // ── Team Performance ──
  const { data: teamPerformance } = await supabase.rpc('get_team_performance')

  const stats = [
    { label: 'Total Leads',       value: totalLeads ?? 0,        Icon: Globe },
    { label: 'Unassigned Leads',  value: unassigned ?? 0,        Icon: UserX },
    { label: 'Leads Contacted',   value: contacted ?? 0,         Icon: MessageSquare },
    { label: 'Awaiting Response', value: awaitingResponse ?? 0,  Icon: Timer },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Key metrics and assignment status for your team.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-label">
              {label}
              <Icon size={18} style={{ color: 'var(--color-on-surface-variant)', opacity: 0.5 }} />
            </div>
            <div className="stat-value">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Crypto & Forex Movers */}
      <MoversCard
        title="Crypto Movers"
        subtitle="Top 100 by Mkt Cap · 24h"
        Icon={Bitcoin}
        gainers={cryptoMovers?.gainers ?? []}
        losers={cryptoMovers?.losers ?? []}
        formatPrice={(price) =>
          `$${price.toLocaleString(undefined, { minimumFractionDigits: price < 1 ? 4 : 2, maximumFractionDigits: price < 1 ? 4 : 2 })}`
        }
        emptyLabel="Crypto data unavailable"
        emptyBody="Could not reach CoinGecko — try again shortly."
      />

      <MoversCard
        title="Forex Movers"
        subtitle="Major Pairs · Live"
        Icon={Landmark}
        gainers={forexMovers?.gainers ?? []}
        losers={forexMovers?.losers ?? []}
        formatPrice={(price) => price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        emptyLabel="Forex data unavailable"
        emptyBody="Check that TWELVEDATA_API_KEY is configured."
      />

      {/* Inactivity Alert Panel */}
      {inactivityReport && inactivityReport.length > 0 && (
        <div className="inactivity-panel">
          <div className="inactivity-header">
            <AlertTriangle size={16} />
            Critical Inactivity Alerts
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sales Rep</th>
                <th style={{ textAlign: 'right' }}>Overdue Leads</th>
                <th style={{ textAlign: 'right' }}>Oldest Assignment</th>
              </tr>
            </thead>
            <tbody>
              {inactivityReport.map((rep) => (
                <tr key={rep.rep_id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 500 }}>{rep.rep_name}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-red)', fontWeight: 600 }}>
                    {rep.overdue_leads}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-on-surface-variant)' }}>
                    {formatDate(rep.oldest_assignment)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Performance Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <TrendingUp size={18} />
              Team Performance
            </span>
          </h2>
          <span className="text-label text-muted">Live Data</span>
        </div>

        {!teamPerformance || teamPerformance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={40} /></div>
            <div className="empty-state-title">No reps yet</div>
            <div className="empty-state-body">Add sales reps in Settings to see performance data.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Rep Name</th>
                <th style={{ textAlign: 'right' }}>Leads Assigned</th>
                <th style={{ textAlign: 'right' }}>Contacted</th>
                <th style={{ textAlign: 'right' }}>Responses</th>
                <th style={{ textAlign: 'right' }}>Overdue</th>
                <th style={{ textAlign: 'right', minWidth: 160 }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((rep) => {
                const pct = Math.min((rep.leads_assigned / rep.capacity) * 100, 100)
                const isOverCapacity = rep.leads_assigned >= rep.capacity
                return (
                  <tr key={rep.rep_id} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: 500 }}>{rep.rep_name}</td>
                    <td style={{ textAlign: 'right' }}>{rep.leads_assigned}</td>
                    <td style={{ textAlign: 'right' }}>{rep.leads_contacted}</td>
                    <td style={{ textAlign: 'right' }}>{rep.leads_responded}</td>
                    <td style={{ textAlign: 'right', color: rep.leads_overdue > 0 ? 'var(--color-red)' : 'inherit', fontWeight: rep.leads_overdue > 0 ? 600 : 400 }}>
                      {rep.leads_overdue}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="capacity-bar" style={{ justifyContent: 'flex-end' }}>
                        <span className="text-table" style={{ flexShrink: 0 }}>
                          {rep.leads_assigned}/{rep.capacity}
                        </span>
                        <div className="capacity-track" style={{ minWidth: 80 }}>
                          <div
                            className={`capacity-fill ${isOverCapacity ? 'over-capacity' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
