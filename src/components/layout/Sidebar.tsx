'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Shuffle, Settings, LogOut, UploadCloud } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface SidebarProps {
  userName: string
}

const navItems = [
  { href: '/admin',             label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/admin/leads',       label: 'Leads',      Icon: Users },
  { href: '/admin/assignment',  label: 'Assignment', Icon: Shuffle },
  { href: '/admin/ingest',      label: 'Ingest',     Icon: UploadCloud },
  { href: '/admin/settings',    label: 'Settings',   Icon: Settings },
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Exact match for dashboard, prefix match for others
  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">AGU</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">AGU CRM</span>
          <span className="sidebar-logo-sub">Internal CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive(href) ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials(userName)}</div>
          <div>
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
