import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode; // Left-side icon
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-md font-medium transition-colors focus:outline-none flex items-center justify-center space-x-2';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800',
      ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const spinnerSizes = {
      sm: 'w-4 h-4 border-2',
      md: 'w-5 h-5 border-2',
      lg: 'w-6 h-6 border-2',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          (isLoading || disabled) && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className={`animate-spin rounded-full border-white border-t-transparent ${spinnerSizes[size]}`} />
        ) : (
          <>
            {icon && <span className="flex items-center">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);
