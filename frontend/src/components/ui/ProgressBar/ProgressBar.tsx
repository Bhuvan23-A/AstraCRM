import React from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  animated = false,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={styles.container}>
      {showLabel && (
        <div className={styles.label}>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div className={`${styles.track} ${styles[size]}`}>
        <div
          className={`${styles.fill} ${styles[variant]} ${
            animated ? styles.animated : ''
          }`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
