import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  hover?: boolean;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  title, 
  actions,
  hover = true,
  gradient = false
}) => {
  return (
    <div 
      className={clsx(
        'glass-card transition-all duration-300',
        hover && 'hover:shadow-glossy-lg hover:scale-[1.02] hover:border-white/20',
        gradient && 'gradient-border',
        className
      )}
    >
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-bold text-white flex items-center">
              <span className="gradient-text">{title}</span>
            </h3>
          )}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};