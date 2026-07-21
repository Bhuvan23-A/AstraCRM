import React, { forwardRef, useId, useState } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className = '',
      label,
      helperText,
      error,
      maxLength,
      showCount,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const [valueLength, setValueLength] = useState(
      props.value ? String(props.value).length : props.defaultValue ? String(props.defaultValue).length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCount) {
        setValueLength(e.target.value.length);
      }
      onChange?.(e);
    };

    const containerClass = [styles.container, className].filter(Boolean).join(' ');
    
    return (
      <div className={containerClass}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={`${styles.wrapper} ${error ? styles.hasError : ''}`}>
          <textarea
            ref={ref}
            id={textareaId}
            className={styles.textarea}
            maxLength={maxLength}
            onChange={handleChange}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        <div className={styles.footer}>
          {(error || helperText) && (
            <p className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
              {error || helperText}
            </p>
          )}
          {showCount && maxLength && (
            <span className={styles.counter}>
              {valueLength} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
