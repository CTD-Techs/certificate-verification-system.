import React, { useRef } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maxSize?: number; // in MB
  className?: string;
  currentFile?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  onChange,
  error,
  required,
  disabled,
  maxSize,
  className = '',
  currentFile,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && maxSize) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        onChange(null);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }
    }

    onChange(file);
  };

  const handleClear = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'file-error' : undefined}
        />

        {currentFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <svg
                className="h-12 w-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {currentFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(currentFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={disabled}
              >
                Change File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={disabled}
              >
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                {accept ? `Accepted: ${accept}` : 'All file types accepted'}
                {maxSize && ` (Max: ${maxSize}MB)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p id="file-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};