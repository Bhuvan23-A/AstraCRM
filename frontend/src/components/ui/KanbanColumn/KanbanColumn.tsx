import React from 'react';
import { Plus } from 'lucide-react';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  title: string;
  count: number;
  color?: string;
  children: React.ReactNode;
  onAdd?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  color = 'var(--color-primary)',
  children,
  onAdd,
}) => {
  return (
    <div className={styles.columnContainer}>
      <div 
        className={styles.header} 
        style={{ borderTopColor: color }}
      >
        <div className={styles.headerContent}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.badge}>{count}</span>
        </div>
        
        {onAdd && (
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAdd}
            aria-label={`Add item to ${title}`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      
      <div className={styles.cardArea}>
        {children}
      </div>
    </div>
  );
};
