import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Users, Building2,
  Banknote, Car, Settings, ChevronLeft, ChevronRight, TrendingUp,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/dossiers',      label: 'Dossiers',         icon: FolderOpen      },
  { to: '/clients',       label: 'Clients',           icon: Users           },
  { to: '/contacts-pro',  label: 'Concessionnaires',  icon: Building2       },
  { to: '/commissions',   label: 'Commissions',       icon: Banknote        },
  { to: '/vehicules',     label: 'Véhicules',         icon: Car             },
]

const BOTTOM_ITEMS = [
  { to: '/parametres', label: 'Paramètres', icon: Settings },
]

// Logo "T + route" dégradé cuivré
const LogoMark = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="s-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e1b16" />
        <stop offset="100%" stopColor="#14120e" />
      </linearGradient>
      <linearGradient id="s-t" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e8b07a" />
        <stop offset="50%" stopColor="#c9843a" />
        <stop offset="100%" stopColor="#9d5f1e" />
      </linearGradient>
      <linearGradient id="s-road" x1="8" y1="20" x2="24" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c9843a" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#9d5f1e" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#s-bg)" />
    <rect width="32" height="32" rx="8" fill="none" stroke="rgba(201,132,58,0.25)" strokeWidth="1" />
    <rect x="5" y="9" width="22" height="2.5" rx="1.25" fill="url(#s-t)" />
    <rect x="13.75" y="11.5" width="4.5" height="11" rx="1" fill="url(#s-t)" />
    <path
      d="M 10 25 L 16 19 L 22 25"
      stroke="url(#s-road)"
      strokeWidth="1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.api.getAppVersion().then((v: string) => setVersion(v)).catch(() => {})
  }, [])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-nav-item${isActive ? ' active' : ''}`

  const itemStyle = (collapsed: boolean) => ({
    justifyContent: collapsed ? 'center' as const : 'flex-start' as const,
    padding: collapsed ? '9px 0' : undefined,
    width: collapsed ? '40px' : undefined,
    margin: collapsed ? '1px auto' : undefined,
  })

  return (
    <div
      className="sidebar"
      style={{
        width: collapsed ? 56 : 224,
        minWidth: collapsed ? 56 : 224,
        maxWidth: collapsed ? 56 : 224,
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '16px 0' : '16px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border)',
          minHeight: 60,
          overflow: 'hidden',
        }}
      >
        <LogoMark size={28} />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              CRM Trajectoire
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              Courtage Auto
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={navLinkClass}
            style={itemStyle(collapsed)}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </NavLink>
        ))}

        {!collapsed && (
          <div style={{ margin: '8px 14px', height: 1, background: 'var(--border)' }} />
        )}
        {collapsed && (
          <div style={{ margin: '8px auto', width: 2, height: 20 }}>
            <div className="sidebar-accent-line" />
          </div>
        )}

        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={navLinkClass}
            style={itemStyle(collapsed)}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      {!collapsed && version && (
        <div style={{ padding: '10px 16px', fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={10} />
          <span>v{version}</span>
        </div>
      )}

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: 18,
          right: -10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = 'var(--accent-dim)'
          el.style.color = 'var(--accent)'
          el.style.borderColor = 'rgba(201,132,58,0.3)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = 'var(--bg-card)'
          el.style.color = 'var(--text-muted)'
          el.style.borderColor = 'var(--border)'
        }}
        title={collapsed ? 'Déplier la sidebar' : 'Réduire la sidebar'}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </div>
  )
}
