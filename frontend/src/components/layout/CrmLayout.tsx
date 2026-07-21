import React from 'react';
import { NavLink } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { Sun, Moon, Users, Building, Target, BookOpen } from 'lucide-react';
import styles from './CrmLayout.module.css';

interface CrmLayoutProps {
  children: React.ReactNode;
}

export const CrmLayout: React.FC<CrmLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className={styles.layout}>
      {/* Temporary Navigation Header until Task 3 (Dashboard Shell) is merged */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.brand}>
            <div className={styles.logo}>S</div>
            <span className={styles.brandName}>Sanna CRM</span>
            <span className={styles.badge}>Module 2 Preview</span>
          </div>
          
          <nav className={styles.nav}>
            <NavLink 
              to="/accounts" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Building size={16} />
              <span>Accounts</span>
            </NavLink>
            <NavLink 
              to="/contacts" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Users size={16} />
              <span>Contacts</span>
            </NavLink>
            <NavLink 
              to="/leads" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Target size={16} />
              <span>Leads</span>
            </NavLink>
            <NavLink 
              to="/components" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <BookOpen size={16} />
              <span>Showcase</span>
            </NavLink>
          </nav>
          
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          {children}
        </div>
      </main>
    </div>
  );
};
