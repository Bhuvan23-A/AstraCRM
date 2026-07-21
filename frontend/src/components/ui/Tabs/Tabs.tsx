import React, { useState, useEffect, useRef } from 'react';
import styles from './Tabs.module.css';

export interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (key: string) => void;
  variant?: 'line' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: externalActiveTab,
  onChange,
  variant = 'line',
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.key);
  const activeKey = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.key === activeKey);
    const activeTabElement = tabRefs.current[activeIndex];
    
    if (activeTabElement && tabsListRef.current) {
      const containerLeft = tabsListRef.current.getBoundingClientRect().left;
      const tabRect = activeTabElement.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerLeft + tabsListRef.current.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [activeKey, tabs]);

  const handleTabClick = (key: string) => {
    if (externalActiveTab === undefined) {
      setInternalActiveTab(key);
    }
    onChange?.(key);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    }

    if (nextIndex !== index) {
      tabRefs.current[nextIndex]?.focus();
      handleTabClick(tabs[nextIndex].key);
    }
  };

  const activeContent = tabs.find(t => t.key === activeKey)?.content;

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.tabsList} ${styles[variant]}`} 
        role="tablist"
        ref={tabsListRef}
      >
        {tabs.map((tab, index) => {
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
              <span className={styles.label}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={styles.badge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
        <div 
          className={styles.indicator} 
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`
          }} 
        />
      </div>
      <div className={styles.contentPanel} role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
};
