import React from 'react';
import type { RequestStatus } from '../../types';

export interface BadgeProps {
  status?: RequestStatus;
  variant?: 'status' | 'green' | 'navy' | 'neutral' | 'warning' | 'danger';
  label?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIGS: Record<RequestStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  E: {
    label: 'Enviada',
    bg: 'bg-[#EAF3F7]',
    text: 'text-[#0D3E4F]',
    border: 'border-[#BBDCE9]',
    dot: 'bg-[#0D3E4F]'
  },
  A: {
    label: 'En atención',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D97706]'
  },
  T: {
    label: 'Terminada',
    bg: 'bg-[#EEF7E6]',
    text: 'text-[#2D6619]',
    border: 'border-[#C8E6B2]',
    dot: 'bg-[#7AC143]'
  },
  C: {
    label: 'Cancelada',
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    dot: 'bg-[#EF4444]'
  }
};

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant = 'status',
  label,
  dot = true,
  size = 'md',
  className = ''
}) => {
  if (status && STATUS_CONFIGS[status]) {
    const config = STATUS_CONFIGS[status];
    const displayLabel = label || config.label;
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
        <span>{displayLabel}</span>
      </span>
    );
  }

  const customVariants = {
    green: 'bg-[#EEF7E6] text-[#2D6619] border-[#C8E6B2]',
    navy: 'bg-[#062D3A] text-white border-[#062D3A]',
    neutral: 'bg-[#F4F6F4] text-[#56696D] border-[#DCE2DD]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    status: 'bg-[#F4F6F4] text-[#062D3A] border-[#DCE2DD]'
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${customVariants[variant]} ${sizeClasses} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />}
      <span>{label}</span>
    </span>
  );
};
