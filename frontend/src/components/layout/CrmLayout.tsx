import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import styles from './CrmLayout.module.css'

const routeMeta: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Dashboard' },
  '/contacts': { label: 'Contacts', parent: 'CRM' },
  '/accounts': { label: 'Accounts', parent: 'CRM' },
  '/leads': { label: 'Leads', parent: 'CRM' },
  '/pipeline': { label: 'Pipeline', parent: 'Sales' },
  '/deals': { label: 'Deals', parent: 'Sales' },
  '/products': { label: 'Products', parent: 'Sales' },
  '/quotations': { label: 'Quotations', parent: 'Sales' },
  '/orders': { label: 'Orders', parent: 'Sales' },
  '/activities': { label: 'Activities', parent: 'Activities' },
  '/tasks': { label: 'Tasks', parent: 'Activities' },
  '/communications': { label: 'Communications', parent: 'Activities' },
  '/notifications': { label: 'Notifications', parent: 'Activities' },
  '/tickets': { label: 'Tickets', parent: 'Support' },
  '/documents': { label: 'Documents', parent: 'Support' },
  '/reports': { label: 'Reports', parent: 'Insights' },
  '/marketing': { label: 'Marketing', parent: 'Insights' },
  '/users': { label: 'Users', parent: 'System' },
  '/settings': { label: 'Settings', parent: 'System' },
  '/import-export': { label: 'Import / Export', parent: 'System' },
  '/audit-log': { label: 'Audit Log', parent: 'System' },
}

export function CrmLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const basePath = '/' + location.pathname.split('/')[1]
  const meta = routeMeta[basePath]
  const breadcrumbs = meta
    ? [...(meta.parent ? [{ label: meta.parent }] : []), { label: meta.label }]
    : [{ label: 'Sanna CRM' }]

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={styles.main}>
        <TopBar
          onSidebarToggle={() => setCollapsed((c) => !c)}
          breadcrumbs={breadcrumbs}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CrmLayout;