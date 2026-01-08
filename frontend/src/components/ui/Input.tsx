import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-dark-300 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-2.5 bg-dark-900 border rounded-lg text-dark-100 placeholder-dark-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
          error ? 'border-red-500' : 'border-dark-700', className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
);
