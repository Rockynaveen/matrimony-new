import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <span className="relative inline-flex items-center justify-center shrink-0">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-white shadow-2xs transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#8B1E3F]/30 peer-focus-visible:ring-offset-1 peer-checked:border-[#8B1E3F] peer-checked:bg-[#8B1E3F] peer-checked:text-white hover:border-slate-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer',
            className
          )}
        >
          <Check className="h-3 w-3 stroke-[3] text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </span>
      </span>
    );
  }
);
Checkbox.displayName = 'Checkbox';
