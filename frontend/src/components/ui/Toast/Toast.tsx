import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className={styles.iconSuccess} size={20} />,
  error: <AlertCircle className={styles.iconError} size={20} />,
  warning: <AlertTriangle className={styles.iconWarning} size={20} />,
  info: <Info className={styles.iconInfo} size={20} />
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 3000,
  onDismiss
}) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(id), 300); // Wait for exit animation
  };

  return (
    <div className={`${styles.toast} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.iconContainer}>
        {icons[type]}
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button className={styles.closeButton} onClick={handleDismiss} aria-label="Close">
        <X size={16} />
      </button>
      {duration > 0 && (
        <div 
          className={`${styles.progressBar} ${styles[`progress-${type}`]}`} 
          style={{ animationDuration: `${duration}ms` }} 
        />
      )}
    </div>
  );
};
