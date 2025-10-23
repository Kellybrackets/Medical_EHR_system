import React from 'react';
import { cn } from '../../utils/helpers';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
            sizeClasses[size],
            className
          )}
        />
        {text && (
          <p className="mt-2 text-sm text-gray-500">{text}</p>
        )}
      </div>
    </div>
  );
};