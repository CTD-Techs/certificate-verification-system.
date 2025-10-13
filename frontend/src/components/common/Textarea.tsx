import React from 'react';

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  rows = 4,
  maxLength,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'textarea-error' : undefined}
      />
      <div className="flex items-center justify-between mt-1">
        {error && (
          <p id="textarea-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {maxLength && (
          <p className="text-sm text-gray-500 ml-auto">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};