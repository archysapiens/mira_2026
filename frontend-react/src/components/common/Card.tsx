import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'navy' | 'warm' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  const variantClasses = {
    default: 'bg-white border border-[#DCE2DD] text-[#062D3A] shadow-[0_2px_8px_rgba(6,45,58,0.04)]',
    navy: 'bg-[#062D3A] border border-[#0D3E4F] text-white shadow-[0_4px_16px_rgba(4,30,39,0.25)]',
    warm: 'bg-[#F5F3EB] border border-[#E8ECE8] text-[#062D3A]',
    subtle: 'bg-[#F7F9F7] border border-[#DCE2DD] text-[#062D3A]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hoverEffect ? 'transition-all duration-200 hover:shadow-md hover:border-[#7AC143]/50 cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden ${variantClasses[variant]} ${hoverClass} ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className={`border-b ${variant === 'navy' ? 'border-[#0D3E4F]' : 'border-[#DCE2DD]'} px-6 py-4 flex items-center justify-between gap-4`}>
          <div>
            {title && (
              <h3 className={`font-bold text-base tracking-tight ${variant === 'navy' ? 'text-white' : 'text-[#062D3A]'}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-xs mt-0.5 ${variant === 'navy' ? 'text-[#B0C4C8]' : 'text-[#56696D]'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`border-t ${variant === 'navy' ? 'border-[#0D3E4F]' : 'border-[#DCE2DD]'} px-6 py-3.5 bg-black/2 flex items-center justify-end gap-3`}>
          {footer}
        </div>
      )}
    </div>
  );
};
