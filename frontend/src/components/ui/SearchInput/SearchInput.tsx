import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  onClear,
  fullWidth = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (onChange) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (onClear) onClear();
    if (onChange) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onChange('');
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      <Search size={16} className={styles.searchIcon} />
      <input
        type="text"
        className={styles.input}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {loading ? (
        <div className={styles.spinner} />
      ) : localValue ? (
        <button className={styles.clearButton} onClick={handleClear} aria-label="Clear search">
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};
