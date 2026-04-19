'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import type { Lead, ContactStatus } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatPhoneDisplay } from '@/lib/phone'

interface Props {
  leads: Lead[]
  outcomeOptions: string[]
  repId: string
}

const STATUS_OPTIONS: ContactStatus[] = [
  'Not Yet Contacted', 'Called', 'Callback Scheduled', 'Unreachable', 'Connected', 'Do Not Contact'
]

function wasContactedBefore(lead: Lead): boolean {
  return lead.last_touched_at !== null && lead.contact_status === 'Not Yet Contacted'
}

function daysSince(iso: string | null): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function SalesViewClient({ leads, outcomeOptions, repId }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'leads' | 'history'>('leads')
  const [localLeads, setLocalLeads] = useState(leads)
  const [saving, setSaving] = useState<string | null>(null)

  async function updateLead(
    leadId: string,
    field: 'contact_status' | 'response_outcome',
    value: string
  ) {
    setSaving(leadId)
    const { data, error } = await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', leadId)
      .select()
      .single()

    if (!error && data) {
      setLocalLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l))

      // Log event
      await supabase.from('lead_events').insert({
        lead_id: leadId,
        actor_id: repId,
        event_type: field === 'contact_status' ? 'status_changed' : 'response_logged',
        payload: { [field]: value },
      })
    }
    setSaving(null)
  }

  const myLeads  = localLeads
  const history  = localLeads.filter(l => l.last_touched_at !== null)

  return (
    <>
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
          My Leads
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          My History
        </button>
      </div>

      {/* My Leads Tab */}
      {activeTab === 'leads' && (
        <div>
          {myLeads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No leads assigned</div>
              <div className="empty-state-body">Your admin will assign leads to you shortly.</div>
            </div>
          ) : (
            myLeads.map(lead => {
              const isPrevContacted = wasContactedBefore(lead)
              const canLogResponse  = lead.contact_status !== 'Not Yet Contacted'
              const isSaving        = saving === lead.id

              return (
                <div key={lead.id}>
                  {isPrevContacted && (
                    <div className="amber-banner">
                      🔄 Previously Contacted ({daysSince(lead.last_touched_at)} day{daysSince(lead.last_touched_at) !== 1 ? 's' : ''} ago)
                    </div>
                  )}
                  <div className="lead-card">
                    <div className="lead-card-body">
                      {/* Lead Info */}
                      <div className="lead-info">
                        <div className="lead-name">{lead.name ?? 'Unknown'}</div>
                        <div className="lead-phone">
                          <Phone size={13} />
                          {formatPhoneDisplay(lead.phone_number)}
                        </div>
                        <div style={{ marginTop: 'var(--space-2)' }}>
                          <StatusBadge status={lead.contact_status} />
                        </div>
                      </div>

                      {/* Status & Response */}
                      <div className="lead-actions">
                        <div className="lead-action-group">
                          <label className="form-label" style={{ fontSize: '0.6rem' }}>Contact Status</label>
                          <select
                            className="form-control"
                            value={lead.contact_status}
                            disabled={isSaving}
                            onChange={e => updateLead(lead.id, 'contact_status', e.target.value)}
                            aria-label="Contact Status"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="lead-action-group">
                          <label className="form-label" style={{ fontSize: '0.6rem' }}>Response</label>
                          <select
                            className="form-control"
                            value={lead.response_outcome ?? ''}
                            disabled={!canLogResponse || isSaving}
                            onChange={e => updateLead(lead.id, 'response_outcome', e.target.value)}
                            title={!canLogResponse ? 'Update Contact Status first' : undefined}
                            aria-label="Response Outcome"
                          >
                            <option value="">Select response…</option>
                            {outcomeOptions.map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* My History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No history yet</div>
              <div className="empty-state-body">Your contact history will appear here once you start updating leads.</div>
            </div>
          ) : (
            <div className="timeline">
              {history.map(lead => (
                <div key={lead.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-header">
                    <span className="timeline-event">{lead.name ?? 'Unknown'} — {lead.contact_status}</span>
                    <span className="timeline-time">{lead.last_touched_at ? new Date(lead.last_touched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                  </div>
                  {lead.response_outcome && (
                    <p className="timeline-note">Response: {lead.response_outcome}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
