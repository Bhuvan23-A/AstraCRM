import { useAuthStore } from '../../stores/authStore'
import { TrendingUp, Users, Package, CheckSquare, ArrowUpRight, Clock } from 'lucide-react'
import styles from './Dashboard.module.css'

const stats = [
  { label: 'Total Leads', value: '—', icon: TrendingUp, color: 'blue', trend: null },
  { label: 'Active Contacts', value: '—', icon: Users, color: 'green', trend: null },
  { label: 'Open Deals', value: '—', icon: Package, color: 'purple', trend: null },
  { label: 'Pending Tasks', value: '—', icon: CheckSquare, color: 'orange', trend: null },
]

const recentActivity = [
  { action: 'New lead captured', detail: 'Via website form', time: 'Just now', color: 'blue' },
  { action: 'Contact updated', detail: 'Profile details changed', time: '2m ago', color: 'green' },
  { action: 'Account created', detail: 'New company onboarded', time: '15m ago', color: 'purple' },
  { action: 'Lead converted', detail: 'Moved to contacts', time: '1h ago', color: 'orange' },
  { action: 'Deal stage updated', detail: 'Moved to negotiation', time: '2h ago', color: 'teal' },
]

const quickLinks = [
  { label: 'Contacts', desc: 'View & manage contacts', href: '/contacts', icon: Users },
  { label: 'Accounts', desc: 'Company records', href: '/accounts', icon: Package },
  { label: 'Leads', desc: 'Track lead pipeline', href: '/leads', icon: TrendingUp },
  { label: 'Tasks', desc: 'Pending follow-ups', href: '/tasks', icon: CheckSquare },
]

export default function Dashboard() {
  const { user } = useAuthStore()

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className={styles.page}>

      {/* Welcome */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>
            {greeting}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className={styles.welcomeSub}>
            Here's your CRM overview for today.
          </p>
        </div>
        <span className={styles.roleBadge}>
          {user?.role?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={`${styles.statCard} ${styles[`stat_${s.color}`]}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>{s.label}</span>
              <div className={styles.statIconWrap}>
                <s.icon size={17} />
              </div>
            </div>
            <div className={styles.statValue}>—</div>
            <div className={styles.statFooter}>
              <Clock size={11} />
              <span>Syncing data...</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className={styles.twoCol}>

        {/* Recent Activity */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Recent Activity</h2>
            <span className={styles.panelBadge}>Live</span>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((a, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${styles[`dot_${a.color}`]}`} />
                <div className={styles.activityContent}>
                  <span className={styles.activityAction}>{a.action}</span>
                  <span className={styles.activityDetail}>{a.detail}</span>
                </div>
                <span className={styles.activityTime}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Quick Access</h2>
          </div>
          <div className={styles.quickGrid}>
            {quickLinks.map((q) => (
              <a key={q.label} href={q.href} className={styles.quickCard}>
                <div className={styles.quickIcon}>
                  <q.icon size={18} />
                </div>
                <div className={styles.quickText}>
                  <span className={styles.quickLabel}>{q.label}</span>
                  <span className={styles.quickDesc}>{q.desc}</span>
                </div>
                <ArrowUpRight size={14} className={styles.quickArrow} />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}