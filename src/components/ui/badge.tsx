import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'border-transparent bg-slate-900 text-white': variant === 'default',
            'border-transparent bg-slate-100 text-slate-900': variant === 'secondary',
            'border-transparent bg-emerald-100 text-emerald-800 border-emerald-200': variant === 'success',
            'border-transparent bg-amber-100 text-amber-800 border-amber-200': variant === 'warning',
            'border-transparent bg-rose-100 text-rose-800 border-rose-200': variant === 'danger',
            'border-transparent bg-blue-100 text-blue-800 border-blue-200': variant === 'info',
          }
        ),
        className
      )}
      {...props}
    />
  );
}
