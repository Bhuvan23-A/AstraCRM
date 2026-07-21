import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, TrendingUp, Package,
  FileText, ShoppingCart, Phone, CheckSquare, MessageSquare,
  Bell, Ticket, FolderOpen, BarChart2, Mail, Settings,
  Download, Activity, Zap, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import styles from './Sidebar.module.css'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/contacts', icon: UserCheck, label: 'Contacts' },
      { to: '/accounts', icon: Users, label: 'Accounts' },
      { to: '/leads', icon: TrendingUp, label: 'Leads' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
      { to: '/deals', icon: Package, label: 'Deals' },
      { to: '/products', icon: Package, label: 'Products' },
      { to: '/quotations', icon: FileText, label: 'Quotations' },
      { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Activities',
    items: [
      { to: '/activities', icon: Phone, label: 'Activities' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/communications', icon: MessageSquare, label: 'Communications' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/tickets', icon: Ticket, label: 'Tickets' },
      { to: '/documents', icon: FolderOpen, label: 'Documents' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', icon: BarChart2, label: 'Reports' },
      { to: '/marketing', icon: Mail, label: 'Marketing' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/users', icon: Users, label: 'Users', adminOnly: true },
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/import-export', icon: Download, label: 'Import / Export' },
      { to: '/audit-log', icon: Activity, label: 'Audit Log', adminOnly: true },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { addToast } = useToastStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const handleLogout = () => {
    logout()
    addToast({ type: 'success', title: 'Success', message: 'Logged out successfully' })
    navigate('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}><Zap size={18} /></div>
        {!collapsed && <span className={styles.logoText}>Sanna CRM</span>}
        <button
          className={styles.collapseBtn}
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !(item as any).adminOnly || isAdmin
          )
          if (!items.length) return null
          return (
            <div key={group.label} className={styles.group}>
              {!collapsed && (
                <span className={styles.groupLabel}>{group.label}</span>
              )}
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={17} className={styles.navIcon} />
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          {!collapsed && (
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.full_name}</span>
              <span className={styles.userRole}>
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}