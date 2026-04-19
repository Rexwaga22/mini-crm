'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserX, Plus, Settings2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { Profile, ResponseOutcome } from '@/types/database'

interface Props {
  users: Pick<Profile, 'id' | 'full_name' | 'role' | 'capacity' | 'is_active' | 'created_at'>[]
  outcomes: ResponseOutcome[]
  inactivityThreshold: number
}

export default function SettingsClient({ users, outcomes, inactivityThreshold }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [activeSection, setActiveSection] = useState<'users' | 'outcomes' | 'general'>('users')
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [localUsers, setLocalUsers]     = useState(users)
  const [localOutcomes, setLocalOutcomes] = useState(outcomes)
  const [threshold, setThreshold]       = useState(inactivityThreshold)

  // New user form
  const [newName,     setNewName]     = useState('')
  const [newEmail,    setNewEmail]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole,     setNewRole]     = useState<'admin' | 'sales'>('sales')
  const [newCapacity, setNewCapacity] = useState(100)
  const [newOutcome,  setNewOutcome]  = useState('')

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function createUser() {
    if (!newEmail || !newPassword || !newName) return
    setLoading('create-user')

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: newRole, capacity: newCapacity }),
    })

    if (res.ok) {
      showToast(`${newName} created successfully`)
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('sales'); setNewCapacity(100)
      router.refresh()
    } else {
      const body = await res.json()
      showToast(body.error ?? 'Failed to create user', 'error')
    }
    setLoading(null)
  }

  async function toggleActive(userId: string, current: boolean) {
    setLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !current })
      .eq('id', userId)

    if (!error) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !current } : u))
      showToast(!current ? 'User reactivated' : 'User deactivated — leads released to pool')
    } else {
      showToast(error.message, 'error')
    }
    setLoading(null)
  }

  async function updateCapacity(userId: string, cap: number) {
    const { error } = await supabase.from('profiles').update({ capacity: cap }).eq('id', userId)
    if (!error) {
      setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, capacity: cap } : u))
      showToast('Capacity updated')
    }
  }

  async function addOutcome() {
    if (!newOutcome.trim()) return
    const { data, error } = await supabase
      .from('response_outcomes')
      .insert({ label: newOutcome.trim(), is_active: true })
      .select()
      .single()
    if (!error && data) {
      setLocalOutcomes(prev => [...prev, data])
      setNewOutcome('')
      showToast('Outcome added')
    } else {
      showToast(error?.message ?? 'Failed to add outcome', 'error')
    }
  }

  async function toggleOutcome(id: string, current: boolean) {
    const { error } = await supabase
      .from('response_outcomes')
      .update({ is_active: !current })
      .eq('id', id)
    if (!error) {
      setLocalOutcomes(prev => prev.map(o => o.id === id ? { ...o, is_active: !current } : o))
      showToast(current ? 'Outcome deactivated' : 'Outcome reactivated')
    }
  }

  async function saveThreshold() {
    const { error } = await supabase
      .from('system_settings')
      .update({ value: threshold.toString() })
      .eq('key', 'inactivity_threshold_days')
    showToast(error ? error.message : 'Threshold saved', error ? 'error' : 'success')
  }

  const sectionBtns = [
    { key: 'users',    label: 'User Management',       Icon: UserPlus },
    { key: 'outcomes', label: 'Response Outcomes',     Icon: Settings2 },
    { key: 'general',  label: 'General Settings',      Icon: Settings2 },
  ] as const

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage users, response outcomes, and system configuration.</p>
      </div>

      <div className="tabs">
        {sectionBtns.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${activeSection === key ? 'active' : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── USER MANAGEMENT ── */}
      {activeSection === 'users' && (
        <>
          {/* Create User */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Add New User</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input className="form-control" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Temporary password" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'sales')}>
                  <option value="sales">Sales Rep</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newRole === 'sales' && (
                <div className="form-group">
                  <label className="form-label">Lead Capacity</label>
                  <input className="form-control" type="number" min={1} max={200} value={newCapacity} onChange={e => setNewCapacity(parseInt(e.target.value))} />
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={createUser}
              disabled={loading === 'create-user' || !newEmail || !newPassword || !newName}
            >
              <UserPlus size={15} />
              {loading === 'create-user' ? 'Creating…' : 'Create User'}
            </button>
          </div>

          {/* User Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: 'var(--space-4) var(--space-6)' }}>
              <h2 className="card-title">All Users</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Capacity</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {localUsers.map(u => (
                  <tr key={u.id} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role === 'sales' ? (
                        <input
                          type="number"
                          min={1} max={200}
                          defaultValue={u.capacity}
                          onBlur={e => updateCapacity(u.id, parseInt(e.target.value))}
                          style={{
                            width: 70,
                            padding: '4px 8px',
                            border: '1px solid var(--color-outline-variant)',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'right',
                            fontFamily: 'inherit',
                            fontSize: 'var(--font-table)',
                          }}
                        />
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-neutral'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        disabled={loading === u.id}
                        onClick={() => toggleActive(u.id, u.is_active)}
                      >
                        <UserX size={13} />
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── RESPONSE OUTCOMES ── */}
      {activeSection === 'outcomes' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Response Outcomes</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <input
              className="form-control"
              value={newOutcome}
              onChange={e => setNewOutcome(e.target.value)}
              placeholder="e.g. Requested Quote"
              style={{ maxWidth: 300 }}
            />
            <button className="btn btn-primary" onClick={addOutcome} disabled={!newOutcome.trim()}>
              <Plus size={14} /> Add Outcome
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {localOutcomes.map(o => (
                <tr key={o.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 500 }}>{o.label}</td>
                  <td>
                    <span className={`badge ${o.is_default ? 'badge-primary' : 'badge-neutral'}`}>
                      {o.is_default ? 'Default' : 'Custom'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${o.is_active ? 'badge-green' : 'badge-neutral'}`}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!o.is_default && (
                      <button
                        className={`btn btn-sm ${o.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleOutcome(o.id, o.is_active)}
                      >
                        {o.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── GENERAL SETTINGS ── */}
      {activeSection === 'general' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-6)' }}>General Settings</h2>
          <div className="form-group">
            <label className="form-label">Inactivity Alert Threshold (days)</label>
            <input
              className="form-control"
              type="number"
              min={1}
              max={30}
              value={threshold}
              onChange={e => setThreshold(parseInt(e.target.value))}
              style={{ maxWidth: 160 }}
            />
            <div style={{ fontSize: 'var(--font-label)', color: 'var(--color-on-surface-variant)', marginTop: 6 }}>
              Leads untouched for this many days will appear in the inactivity alert panel.
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveThreshold}>Save Changes</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </>
  )
}
