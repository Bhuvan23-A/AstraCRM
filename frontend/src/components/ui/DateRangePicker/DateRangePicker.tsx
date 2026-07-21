import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DateRangePicker.module.css';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = { start: null, end: null },
  onChange,
  label,
  placeholder = 'Select date range',
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value.start || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  // Track internal state of range during selection process
  const [internalRange, setInternalRange] = useState<DateRange>(value);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalRange(value);
    if (value.start) setCurrentMonth(value.start);
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

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const displayValue = internalRange.start 
    ? `${formatDate(internalRange.start)} → ${internalRange.end ? formatDate(internalRange.end) : '...'}`
    : '';

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = (baseMonth: Date) => {
    const year = baseMonth.getFullYear();
    const month = baseMonth.getMonth();
    
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

  const handleDateClick = (date: Date) => {
    let newRange: DateRange;
    
    if (!internalRange.start || (internalRange.start && internalRange.end)) {
      // Start new selection
      newRange = { start: date, end: null };
    } else {
      // Complete selection
      if (date < internalRange.start) {
        newRange = { start: date, end: internalRange.start };
      } else {
        newRange = { start: internalRange.start, end: date };
      }
      setIsOpen(false);
    }
    
    setInternalRange(newRange);
    if (onChange && newRange.start && newRange.end) {
      onChange(newRange);
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isInRange = (date: Date) => {
    if (!internalRange.start) return false;
    
    const time = date.getTime();
    
    if (internalRange.end) {
      return time >= internalRange.start.getTime() && time <= internalRange.end.getTime();
    }
    
    if (hoverDate) {
      const startT = internalRange.start.getTime();
      const hoverT = hoverDate.getTime();
      return time >= Math.min(startT, hoverT) && time <= Math.max(startT, hoverT);
    }
    
    return false;
  };

  const isEndpoint = (date: Date) => {
    if (!internalRange.start) return false;
    
    const time = date.getTime();
    if (time === internalRange.start.getTime()) return true;
    if (internalRange.end && time === internalRange.end.getTime()) return true;
    
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const renderCalendar = (monthDate: Date, showPrev: boolean, showNext: boolean) => (
    <div className={styles.calendarPane}>
      <div className={styles.header}>
        {showPrev ? (
          <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </button>
        ) : <div className={styles.navPlaceholder} />}
        
        <span className={styles.monthYear}>
          {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
        </span>
        
        {showNext ? (
          <button type="button" className={styles.navButton} onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </button>
        ) : <div className={styles.navPlaceholder} />}
      </div>
      
      <div className={styles.grid}>
        {weekDays.map(day => (
          <div key={day} className={styles.weekDay}>{day}</div>
        ))}
        
        {generateCalendarDays(monthDate).map((dayObj, i) => {
          const endpoint = isEndpoint(dayObj.date);
          const inRange = isInRange(dayObj.date);
          const today = isToday(dayObj.date);
          
          let cellClass = styles.dayCell;
          if (!dayObj.isCurrentMonth) cellClass += ` ${styles.outsideMonth}`;
          if (endpoint) cellClass += ` ${styles.endpoint}`;
          else if (inRange) cellClass += ` ${styles.inRange}`;
          if (today) cellClass += ` ${styles.today}`;

          return (
            <button
              key={i}
              type="button"
              className={cellClass}
              onClick={() => handleDateClick(dayObj.date)}
              onMouseEnter={() => setHoverDate(dayObj.date)}
            >
              {dayObj.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

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
          value={displayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
        />
        <CalendarIcon className={styles.icon} size={18} />
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}

      {isOpen && (
        <div className={styles.dropdown}>
          {renderCalendar(currentMonth, true, false)}
          <div className={styles.divider} />
          {renderCalendar(nextMonth, false, true)}
        </div>
      )}
    </div>
  );
};
