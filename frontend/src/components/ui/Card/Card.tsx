import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'stat';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  onClick,
}) => {
  const classes = [
    styles.card,
    styles[variant],
    styles[`pad-${padding}`],
    hoverable ? styles.hoverable : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
}) => {
  return (
    <Card variant="stat" padding="md">
      <div className={styles.statHeader}>
        <h3 className={styles.statTitle}>{title}</h3>
        {icon && <div className={styles.statIcon}>{icon}</div>}
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
      </div>
      {(change !== undefined || changeLabel) && (
        <div className={styles.statFooter}>
          {change !== undefined && (
            <span
              className={`${styles.statChange} ${
                change > 0 ? styles.positive : change < 0 ? styles.negative : styles.neutral
              }`}
            >
              {change > 0 ? '↑' : change < 0 ? '↓' : ''} {Math.abs(change)}%
            </span>
          )}
          {changeLabel && <span className={styles.statChangeLabel}>{changeLabel}</span>}
        </div>
      )}
    </Card>
  );
};
