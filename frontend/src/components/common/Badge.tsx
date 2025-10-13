import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'error' | 'primary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className }) => {
  const variantClasses = {
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-sm',
    success: 'bg-success-500/20 text-success-300 border border-success-500/30 shadow-sm',
    danger: 'bg-danger-500/20 text-danger-300 border border-danger-500/30 shadow-sm',
    error: 'bg-danger-500/20 text-danger-300 border border-danger-500/30 shadow-sm',
    warning: 'bg-warning-500/20 text-warning-300 border border-warning-500/30 shadow-sm',
    info: 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30 shadow-sm',
    gray: 'bg-gray-500/20 text-gray-300 border border-gray-500/30 shadow-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};