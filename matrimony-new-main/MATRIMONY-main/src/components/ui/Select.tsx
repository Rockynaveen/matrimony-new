import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, options, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 font-medium shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E3F]/25 focus-visible:border-[#8B1E3F] hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer pr-10',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';
