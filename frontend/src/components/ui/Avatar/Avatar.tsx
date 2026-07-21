import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const stringToHslColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  status,
}) => {
  const bgColor = src ? 'transparent' : stringToHslColor(name);
  const initials = getInitials(name);

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div 
        className={styles.avatar} 
        style={{ backgroundColor: bgColor }}
        aria-label={name}
      >
        {src ? (
          <img src={src} alt={name} className={styles.image} />
        ) : (
          <span className={styles.initials} style={{ color: 'rgba(0,0,0,0.6)' }}>
            {initials}
          </span>
        )}
      </div>
      {status && (
        <span className={`${styles.status} ${styles[status]}`} />
      )}
    </div>
  );
};
