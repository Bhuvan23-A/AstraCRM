import React from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import styles from './Toast.module.css';
import { useToastStore } from '../../../stores/toastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container}>
      {toasts.map((toast: any) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onDismiss={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};
