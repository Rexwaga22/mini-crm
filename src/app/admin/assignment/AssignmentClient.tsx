'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2, CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface RepDist {
  id: string
  full_name: string
  capacity: number
  currentLeads: number
  leadsToReceive: number
}

interface Props {
  unassignedCount: number
  unassignedLeadIds: string[]
  distribution: RepDist[]
  repCount: number
}

export default function AssignmentClient({ unassignedCount, unassignedLeadIds, distribution, repCount }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleConfirm() {
    if (unassignedCount === 0) return
    setLoading(true)
    setError(null)

    const repIds = distribution
      .filter(r => r.leadsToReceive > 0)
      .map(r => r.id)

    // @ts-expect-error - Supabase generic typing for rpc args sometimes resolves Args to undefined depending on tsconfig strictness
    const { error: rpcErr } = await supabase.rpc('even_split_assign', {
      lead_ids: unassignedLeadIds,
      rep_ids:  repIds,
    })

    if (rpcErr) {
      setError(rpcErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => { router.push('/admin'); router.refresh() }, 1500)
  }

  const canAssign = unassignedCount > 0 && repCount > 0

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Lead Distribution</h1>
        <p className="page-subtitle">Manage and confirm automated lead assignments or perform manual overrides.</p>
      </div>

      {/* Summary Banner */}
      <div className="distribution-summary">
        <div className="distribution-icon">
          <BarChart2 size={24} />
        </div>
        <div>
          <div className="distribution-title">
            You have <strong>{unassignedCount}</strong> unassigned lead{unassignedCount !== 1 ? 's' : ''} and{' '}
            <strong>{repCount}</strong> available rep{repCount !== 1 ? 's' : ''}.
          </div>
          <div className="distribution-subtitle">
            {canAssign ? 'Ready for Distribution' : unassignedCount === 0 ? 'No unassigned leads' : 'No active reps available'}
          </div>
        </div>
      </div>

      {/* Proposed Assignment Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Proposed Assignment</h2>
          <span className="text-label text-muted">Even-Split Logic Active</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Rep Name</th>
              <th style={{ textAlign: 'right' }}>Current Leads</th>
              <th style={{ textAlign: 'right' }}>Remaining Capacity</th>
              <th style={{ textAlign: 'right', color: 'var(--color-primary)' }}>Leads to Receive</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map(rep => (
              <tr key={rep.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 500 }}>{rep.full_name}</td>
                <td style={{ textAlign: 'right' }}>{rep.currentLeads}</td>
                <td style={{ textAlign: 'right' }}>{rep.capacity - rep.currentLeads}</td>
                <td style={{ textAlign: 'right' }}>
                  {rep.leadsToReceive > 0
                    ? <span className="leads-to-receive">+{rep.leadsToReceive}</span>
                    : <span className="text-muted">—</span>
                  }
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 600, borderTop: '2px solid var(--color-outline-variant)', cursor: 'default' }}>
              <td>Total Unassigned</td>
              <td></td>
              <td></td>
              <td style={{ textAlign: 'right', color: 'var(--color-primary)', fontWeight: 700 }}>
                {unassignedCount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)', gap: 'var(--space-3)' }}>
          {error && (
            <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-table)', alignSelf: 'center' }}>
              {error}
            </span>
          )}
          {success ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-green)', fontWeight: 600 }}>
              <CheckCircle size={18} /> Assignments confirmed! Redirecting…
            </div>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirm}
              disabled={!canAssign || loading}
            >
              <CheckCircle size={16} />
              {loading ? 'Assigning…' : 'Confirm Assignment'}
            </button>
          )}
        </div>
      </div>

      {/* Manual Override */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 'var(--space-2)' }}>Manual Override</h2>
        <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-4)' }}>
          Bypass automated logic and assign specific leads directly to a representative.
        </p>
        <p style={{ fontSize: 'var(--font-table)', color: 'var(--color-on-surface-variant)' }}>
          Select individual leads from the{' '}
          <a href="/admin/leads" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Leads page</a>
          {' '}to manually assign them to a rep.
        </p>
      </div>
    </>
  )
}
