'use client'

import { useState, useCallback } from 'react'
import { X, Phone, Edit2, Clock } from 'lucide-react'
import type { Lead, LeadEvent, Profile } from '@/types/database'
import { formatPhoneDisplay } from '@/lib/phone'
import StatusBadge from '@/components/ui/StatusBadge'

interface Props {
  lead: Lead & { profiles: Pick<Profile, 'full_name'> | null }
  events: LeadEvent[]
  onClose: () => void
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function formatEventLabel(type: string): string {
  const map: Record<string, string> = {
    captured:       'Lead Captured',
    assigned:       'Assigned to Rep',
    reassigned:     'Reassigned',
    status_changed: 'Status Updated',
    response_logged:'Response Logged',
    dnc_flagged:    'Marked Do Not Contact',
  }
  return map[type] ?? type
}

export default function LeadSlideOver({ lead, events, onClose }: Props) {
  return (
    <>
      <div className="slide-over-backdrop" onClick={onClose} />
      <aside className="slide-over">
        {/* Header */}
        <div className="slide-over-header">
          <div>
            <h2 className="text-headline" style={{ marginBottom: 4 }}>
              {lead.name ?? 'Unknown Name'}
            </h2>
            <div style={{ fontSize: 'var(--font-body)', color: 'var(--color-on-surface-variant)' }}>
              {formatPhoneDisplay(lead.phone_number)}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <a
            href={`tel:${lead.phone_number}`}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <Phone size={15} /> Call Now
          </a>
          <button className="btn btn-secondary" style={{ flex: 1 }}>
            <Edit2 size={15} /> Edit Lead
          </button>
        </div>

        {/* Details */}
        <div className="slide-over-section">
          <div className="slide-over-section-title">Lead Details</div>
          <div style={{ background: 'var(--color-surface-low)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-3)' }}>
            <div className="detail-row">
              <span className="detail-key">Contact Status</span>
              <StatusBadge status={lead.contact_status} />
            </div>
            <div className="detail-row">
              <span className="detail-key">Assigned Rep</span>
              <span className="detail-value">{lead.profiles?.full_name ?? '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Source</span>
              <span className="detail-value">{lead.source ?? '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Interest Level</span>
              <span className="detail-value">{lead.interest_level ?? '—'}</span>
            </div>
            {lead.response_outcome && (
              <div className="detail-row">
                <span className="detail-key">Response</span>
                <span className="detail-value">{lead.response_outcome}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="slide-over-section">
          <div className="slide-over-section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> Timeline
            </span>
          </div>

          {events.length === 0 ? (
            <p style={{ fontSize: 'var(--font-table)', color: 'var(--color-on-surface-variant)' }}>
              No events recorded yet.
            </p>
          ) : (
            <div className="timeline">
              {events.map((ev, i) => {
                const payload = ev.payload as Record<string, string>
                return (
                  <div key={ev.id} className="timeline-item">
                    <div className={`timeline-dot ${i > 0 ? 'muted' : ''}`} />
                    <div className="timeline-header">
                      <span className="timeline-event">{formatEventLabel(ev.event_type)}</span>
                      <span className="timeline-time">{timeAgo(ev.created_at)}</span>
                    </div>
                    {payload?.notes && (
                      <p className="timeline-note">{payload.notes}</p>
                    )}
                    {payload?.to && !payload?.notes && (
                      <p className="timeline-note">→ {payload.to}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
