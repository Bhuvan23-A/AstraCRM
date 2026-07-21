import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className={styles.item}>
              {isLast ? (
                <span className={`${styles.label} ${styles.current}`} aria-current="page">
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <a href={item.href || '#'} className={`${styles.label} ${styles.link}`}>
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  {item.label}
                </a>
              )}
              
              {!isLast && (
                <ChevronRight size={16} className={styles.separator} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
