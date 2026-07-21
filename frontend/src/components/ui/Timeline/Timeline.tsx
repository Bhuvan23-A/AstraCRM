import React from 'react';
import styles from './Timeline.module.css';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
  type?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

interface TimelineProps {
  items: TimelineItem[];
  loading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ items, loading = false }) => {
  if (loading) {
    return (
      <div className={styles.container}>
        {[1, 2, 3].map((_, i) => (
          <div key={`skeleton-${i}`} className={styles.item}>
            <div className={styles.line}></div>
            <div className={`${styles.dot} ${styles.skeletonDot}`}></div>
            <div className={styles.content}>
              <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
              <div className={`${styles.skeletonText} ${styles.skeletonDesc}`}></div>
              <div className={`${styles.skeletonText} ${styles.skeletonTime}`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {items.map((item, index) => {
        const typeClass = item.type ? styles[item.type] : styles.default;
        
        return (
          <div 
            key={item.id} 
            className={styles.item}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* The vertical line - not shown on the last item */}
            {index < items.length - 1 && <div className={styles.line}></div>}
            
            <div className={`${styles.dot} ${typeClass}`}>
              {item.icon}
            </div>
            
            <div className={styles.content}>
              <h4 className={styles.title}>{item.title}</h4>
              {item.description && (
                <p className={styles.description}>{item.description}</p>
              )}
              <span className={styles.timestamp}>{item.timestamp}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
