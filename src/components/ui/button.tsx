import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            {
              // variants
              'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-950': variant === 'default',
              'border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 focus-visible:ring-slate-950': variant === 'outline',
              'hover:bg-slate-100 text-slate-900': variant === 'ghost',
              'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500': variant === 'danger',
              'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500': variant === 'success',
              // sizes
              'h-9 px-3 text-sm': size === 'sm',
              'h-10 px-4 py-2': size === 'md',
              'h-11 px-8 text-base': size === 'lg',
            },
            className
          )
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
