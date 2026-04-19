'use client'

import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import type { Lead, LeadEvent, Profile, ContactStatus } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import { exportToCsv } from '@/lib/csv'
import StatusBadge from '@/components/ui/StatusBadge'
import LeadSlideOver from '@/components/leads/LeadSlideOver'
import { formatPhoneDisplay } from '@/lib/phone'

interface Props {
  initialLeads: (Lead & { profiles: Pick<Profile, 'full_name'> | null })[]
  reps: Pick<Profile, 'id' | 'full_name'>[]
  outcomeOptions: string[]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ALL = 'all'

export default function LeadsClient({ initialLeads, reps, outcomeOptions }: Props) {
  const supabase = createClient()

  const [leads, setLeads]               = useState(initialLeads)
  const [selectedLead, setSelectedLead] = useState<typeof initialLeads[0] | null>(null)
  const [events, setEvents]             = useState<LeadEvent[]>([])

  // Filters
  const [statusFilter, setStatusFilter]   = useState<string>(ALL)
  const [outcomeFilter, setOutcomeFilter] = useState<string>(ALL)
  const [repFilter, setRepFilter]         = useState<string>(ALL)

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (statusFilter  !== ALL && l.contact_status   !== statusFilter)  return false
      if (outcomeFilter !== ALL && l.response_outcome !== outcomeFilter) return false
      if (repFilter     !== ALL && l.assigned_to      !== repFilter)     return false
      return true
    })
  }, [leads, statusFilter, outcomeFilter, repFilter])

  async function openLead(lead: typeof initialLeads[0]) {
    setSelectedLead(lead)
    const { data } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setEvents(data ?? [])
  }

  function handleExport() {
    exportToCsv(`leads-export-${Date.now()}.csv`, filtered.map(l => ({
      name:             l.name ?? '',
      phone_number:     l.phone_number,
      assigned_to:      l.profiles?.full_name ?? '',
      contact_status:   l.contact_status,
      response_outcome: l.response_outcome ?? '',
      date_assigned:    formatDate(l.date_assigned),
      source:           l.source ?? '',
      interest_level:   l.interest_level ?? '',
    })))
  }

  const statusOptions: ContactStatus[] = [
    'Not Yet Contacted', 'Called', 'Callback Scheduled', 'Unreachable', 'Connected', 'Do Not Contact'
  ]

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Leads</h1>
        <p className="page-subtitle">Manage and track your active prospects.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by contact status"
        >
          <option value={ALL}>Contact Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="filter-select"
          value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value)}
          aria-label="Filter by response outcome"
        >
          <option value={ALL}>Response Outcome</option>
          {outcomeOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          className="filter-select"
          value={repFilter}
          onChange={e => setRepFilter(e.target.value)}
          aria-label="Filter by assigned rep"
        >
          <option value={ALL}>Assigned Rep</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
        </select>

        <div className="filter-spacer" />

        <button className="btn btn-ghost btn-sm" onClick={handleExport}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Leads Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No leads found</div>
            <div className="empty-state-body">Try adjusting your filters, or add new leads.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Name</th>
                <th>Assigned To</th>
                <th>Contact Status</th>
                <th>Response Outcome</th>
                <th>Date Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => openLead(lead)}
                  style={{ borderLeft: selectedLead?.id === lead.id ? '3px solid var(--color-primary)' : '3px solid transparent' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lead.contact_status !== 'Not Yet Contacted' && lead.assigned_to && (
                        <span className="dot-amber" title="Previously contacted" />
                      )}
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-table)' }}>
                        {formatPhoneDisplay(lead.phone_number)}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: selectedLead?.id === lead.id ? 'var(--color-primary)' : 'inherit' }}>
                    {lead.name ?? '—'}
                  </td>
                  <td>
                    {lead.profiles?.full_name ? (
                      <div className="avatar-group">
                        <div className="avatar">{initials(lead.profiles.full_name)}</div>
                        <span style={{ fontSize: 'var(--font-table)' }}>{lead.profiles.full_name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-table)' }}>Unassigned</span>
                    )}
                  </td>
                  <td><StatusBadge status={lead.contact_status} /></td>
                  <td style={{ fontSize: 'var(--font-table)', color: 'var(--color-on-surface-variant)' }}>
                    {lead.response_outcome ?? '—'}
                  </td>
                  <td style={{ fontSize: 'var(--font-table)', color: 'var(--color-on-surface-variant)', whiteSpace: 'nowrap' }}>
                    {formatDate(lead.date_assigned)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-Over */}
      {selectedLead && (
        <LeadSlideOver
          lead={selectedLead}
          events={events}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  )
}
