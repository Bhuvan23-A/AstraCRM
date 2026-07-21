import React, { useId } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
}) => {
  const generatedId = useId();

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <div className={`${styles.trackWrapper} ${styles[size]}`}>
        <input
          type="checkbox"
          id={generatedId}
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <div className={`${styles.track} ${checked ? styles.checked : ''}`}>
          <div className={styles.thumb} />
        </div>
      </div>
      {label && (
        <label htmlFor={generatedId} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  );
};
