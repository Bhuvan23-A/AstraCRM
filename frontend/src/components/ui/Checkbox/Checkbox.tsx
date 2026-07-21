import React, { useId } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
}) => {
  const generatedId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.wrapper}>
        <input
          type="checkbox"
          id={generatedId}
          className={styles.input}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          ref={(input) => {
            if (input) {
              input.indeterminate = indeterminate;
            }
          }}
        />
        <div className={`${styles.box} ${checked || indeterminate ? styles.checked : ''}`}>
          {indeterminate ? (
            <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 12h12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
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
