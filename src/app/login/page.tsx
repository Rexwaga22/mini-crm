'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Invalid email or password.')
      setLoading(false)
      return
    }

    // Fetch role for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/admin' : '/sales')
    router.refresh()
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-10) var(--space-10)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--color-surface-low)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            fontSize: '1.5rem',
          }}>🏛️</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '-0.01em', marginBottom: 'var(--space-1)' }}>
            AGU CRM
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Sign In</div>
          <div style={{ fontSize: 'var(--font-body)', color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
            Access the Precision Ledger
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
              <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
            </div>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-table)',
              marginBottom: 'var(--space-4)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {loading ? 'Signing in…' : 'Login →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-table)', color: 'var(--color-on-surface-variant)' }}>
          Need help?{' '}
          <a href="mailto:support@agucrm.com" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Contact IT Support
          </a>
        </div>
      </div>
    </main>
  )
}
