import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderOpen, Building2,
  Car, Banknote, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/dossiers', icon: FolderOpen, label: 'Dossiers' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/contacts-pro', icon: Building2, label: 'Concessionnaires' },
  { to: '/commissions', icon: Banknote, label: 'Commissions' },
  { to: '/vehicules', icon: Car, label: 'Véhicules' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' }
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-bg-secondary transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-9" style={{ marginTop: 36 }}>
        <div className={cn('flex items-center gap-2 px-4 py-3 w-full', collapsed && 'justify-center px-0')}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-accent-blue flex items-center justify-center flex-shrink-0">
                <Car size={14} className="text-white" />
              </div>
              <span className="font-semibold text-text-primary text-sm tracking-wide">ASB CRM</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded bg-accent-blue flex items-center justify-center">
              <Car size={14} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-border text-text-muted hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
