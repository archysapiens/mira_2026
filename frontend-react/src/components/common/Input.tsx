import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const widthClass = fullWidth ? 'w-full' : '';

  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
    : 'border-[#DCE2DD] focus:border-[#7AC143] focus:ring-[#EEF7E6]';

  return (
    <div className={`${widthClass} flex flex-col gap-1.5`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#062D3A] tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8E9FA2]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full px-3.5 py-2.5 text-sm bg-white text-[#062D3A] border rounded-lg 
            placeholder:text-[#8E9FA2] transition-colors duration-150 outline-none
            focus:ring-2 disabled:bg-[#F4F6F4] disabled:text-[#8E9FA2] disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${borderClass}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#8E9FA2]">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-red-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#56696D]">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
