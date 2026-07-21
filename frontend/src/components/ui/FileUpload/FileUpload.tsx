import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeMB,
  label,
  helperText,
  error,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setLocalError(null);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setLocalError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }
      validFiles.push(file);
    }

    const updatedFiles = multiple ? [...files, ...validFiles] : [validFiles[0]];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${
          error || localError ? styles.errorZone : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={styles.icon} />
        <p className={styles.instruction}>
          <span className={styles.browseText}>Click to upload</span> or drag and drop
        </p>
        {helperText && <p className={styles.helperText}>{helperText}</p>}
        <input
          type="file"
          ref={inputRef}
          className={styles.input}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
        />
      </div>
      
      {(error || localError) && (
        <p className={styles.errorText}>{error || localError}</p>
      )}

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
