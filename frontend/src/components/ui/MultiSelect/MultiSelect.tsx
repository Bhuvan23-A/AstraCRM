import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import styles from './MultiSelect.module.css';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxSelected?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value = [],
  onChange,
  placeholder = 'Select items',
  error,
  disabled = false,
  searchable = false,
  maxSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleOptionClick = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (disabled) return;

    const isSelected = value.includes(optionValue);
    let newValues: string[];

    if (isSelected) {
      newValues = value.filter(v => v !== optionValue);
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      newValues = [...value, optionValue];
    }

    if (onChange) onChange(newValues);
    if (searchable) inputRef.current?.focus();
  };

  const removeTag = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    
    const newValues = value.filter(v => v !== optionValue);
    if (onChange) onChange(newValues);
  };

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const isAtMax = maxSelected !== undefined && value.length >= maxSelected;

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div 
        className={`${styles.inputWrapper} ${error ? styles.errorInput : ''} ${isOpen ? styles.open : ''}`}
        onClick={handleToggleDropdown}
      >
        <div className={styles.tagsContainer}>
          {value.length === 0 && !searchQuery && (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
          
          {value.map(val => {
            const option = options.find(o => o.value === val);
            if (!option) return null;
            return (
              <span key={val} className={styles.tag}>
                {option.label}
                <button 
                  type="button" 
                  className={styles.tagRemove}
                  onClick={(e) => removeTag(val, e)}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {searchable && isOpen && !isAtMax && (
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={value.length === 0 ? placeholder : ""}
            />
          )}
        </div>
        
        <div className={styles.indicators}>
          {value.length > 0 && !disabled && (
            <button 
              type="button" 
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onChange) onChange([]);
              }}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown className={styles.chevron} size={18} />
        </div>
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}
      
      {maxSelected && (
        <p className={styles.helperText}>
          {value.length} / {maxSelected} selected
        </p>
      )}

      {isOpen && (
        <div className={styles.dropdown}>
          {searchable && !isOpen && (
             <div className={styles.searchHeader}>
               <Search size={16} className={styles.searchIcon} />
               <input
                 type="text"
                 className={styles.dropdownSearch}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search..."
                 autoFocus
               />
             </div>
          )}
          
          <ul className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <li className={styles.noResults}>No options found</li>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value);
                const isDisabled = !isSelected && isAtMax;
                
                return (
                  <li 
                    key={option.value}
                    className={`${styles.option} ${isSelected ? styles.selectedOption : ''} ${isDisabled ? styles.disabledOption : ''}`}
                    onClick={(e) => !isDisabled && handleOptionClick(option.value, e)}
                  >
                    <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <span>{option.label}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
