import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import styles from './TopBar.module.css'

interface Crumb { label: string }

interface TopBarProps {
  onSidebarToggle: () => void
  breadcrumbs?: Crumb[]
}

export default function TopBar({ onSidebarToggle, breadcrumbs = [] }: TopBarProps) {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <button className={styles.iconBtn} onClick={onSidebarToggle} title="Toggle sidebar">
          <Menu size={19} />
        </button>
        {breadcrumbs.length > 0 && (
          <nav className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className={styles.crumbItem}>
                {i > 0 && <span className={styles.sep}>/</span>}
                <span className={i === breadcrumbs.length - 1 ? styles.crumbActive : styles.crumb}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>
      </div>
    </header>
  )
}