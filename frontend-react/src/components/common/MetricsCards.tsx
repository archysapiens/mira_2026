import React from 'react';
import type { DashboardCounts } from '../../types';

interface MetricsCardsProps {
  counts: DashboardCounts;
  totalLabel?: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  counts,
  totalLabel = 'Total Servicios',
}) => {
  const total = (counts.E || 0) + (counts.A || 0) + (counts.T || 0) + (counts.C || 0);

  const metrics = [
    {
      id: 'total',
      label: totalLabel,
      value: total,
      color: 'text-[#062D3A]',
      bg: 'bg-white',
      border: 'border-[#E8ECEF]',
      badgeBg: 'bg-[#F4F7F9]',
      badgeText: 'text-[#56696D]',
      icon: '📊',
    },
    {
      id: 'E',
      label: 'Enviadas / Recibidas',
      value: counts.E || 0,
      color: 'text-amber-800',
      bg: 'bg-white',
      border: 'border-amber-200/80',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      icon: '📥',
    },
    {
      id: 'A',
      label: 'En Atención / Proceso',
      value: counts.A || 0,
      color: 'text-sky-800',
      bg: 'bg-white',
      border: 'border-sky-200/80',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700',
      icon: '⚙️',
    },
    {
      id: 'T',
      label: 'Concluidas con Éxito',
      value: counts.T || 0,
      color: 'text-emerald-800',
      bg: 'bg-white',
      border: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      icon: '✅',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.id}
          className={`${m.bg} ${m.border} border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#56696D]">{m.label}</span>
            <span className={`text-base p-1.5 rounded-lg ${m.badgeBg}`}>
              {m.icon}
            </span>
          </div>
          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-extrabold ${m.color}`}>
              {m.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

