import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  error,
  minDate,
  maxDate,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = [];
    
    // Prev month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate.setHours(0,0,0,0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23,59,59,999))) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    if (onChange) onChange(date);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.inputWrapper} ${error ? styles.errorInput : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          className={styles.input}
          value={formatDate(value)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
        />
        <CalendarIcon className={styles.icon} size={18} />
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthYear}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button type="button" className={styles.navButton} onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className={styles.grid}>
            {weekDays.map(day => (
              <div key={day} className={styles.weekDay}>{day}</div>
            ))}
            
            {generateCalendarDays().map((dayObj, i) => {
              const disabled = isDateDisabled(dayObj.date);
              const selected = isDateSelected(dayObj.date);
              const today = isToday(dayObj.date);
              
              let cellClass = styles.dayCell;
              if (!dayObj.isCurrentMonth) cellClass += ` ${styles.outsideMonth}`;
              if (selected) cellClass += ` ${styles.selected}`;
              if (today) cellClass += ` ${styles.today}`;
              if (disabled) cellClass += ` ${styles.disabledDay}`;

              return (
                <button
                  key={i}
                  type="button"
                  className={cellClass}
                  onClick={() => handleDateClick(dayObj.date)}
                  disabled={disabled}
                >
                  {dayObj.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
