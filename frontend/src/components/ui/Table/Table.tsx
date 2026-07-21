import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import styles from './Table.module.css';

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  emptyMessage = 'No data available',
  stickyHeader = false,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectionChange) {
      if (e.target.checked) {
        onSelectionChange(data.map(row => String(row.id)));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (onSelectionChange) {
      if (e.target.checked) {
        onSelectionChange([...selectedRows, id]);
      } else {
        onSelectionChange(selectedRows.filter(rowId => rowId !== id));
      }
    }
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={stickyHeader ? styles.stickyHeader : ''}>
          <tr>
            {selectable && (
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`${styles.th} ${col.sortable ? styles.sortable : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className={styles.headerContent}>
                  {col.title}
                  {col.sortable && (
                    <span className={styles.sortIcon}>
                      {sortKey === col.key ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronUp size={14} className={styles.sortIconIdle} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className={styles.skeletonRow}>
                {selectable && <td><div className={styles.skeletonCell}></div></td>}
                {columns.map((col, i) => (
                  <td key={i}><div className={styles.skeletonCell}></div></td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={row.id}
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''} ${
                  selectedRows.includes(String(row.id)) ? styles.selected : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {selectable && (
                  <td className={styles.checkboxCell} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(String(row.id))}
                      onChange={e => handleSelectRow(e, String(row.id))}
                      className={styles.checkbox}
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={styles.td}>
                    {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
