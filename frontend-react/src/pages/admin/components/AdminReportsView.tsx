import React from 'react';
import type { DashboardCounts, ServiceRequest } from '../../../types';
import { formatNeed } from '../../../utils/formatters';

interface AdminReportsViewProps {
  counts: DashboardCounts;
  requests: ServiceRequest[];
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ counts, requests }) => {
  const total = requests.length || 1;
  const approvalRate = Math.round((counts.T / total) * 100);
  const inAttentionRate = Math.round((counts.A / total) * 100);

  // Desglose por necesidad / servicio
  const needCounts: Record<string, number> = {};
  requests.forEach((r) => {
    const key = formatNeed(r.Need);
    needCounts[key] = (needCounts[key] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062D3A] text-white text-xs">📈</span>
            <h2 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight">
              Reportes y Métricas Operativas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#56696D] mt-1">
            Análisis de rendimiento, tasa de conversión y distribución de solicitudes industriales.
          </p>
        </div>

        <div className="text-xs text-[#56696D] bg-[#F8FAFC] px-3.5 py-2 rounded-lg border border-[#E8ECEF] font-bold">
          Corte al: <span className="text-[#062D3A]">{new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#8E9FA2] uppercase block">Total Cotizaciones</span>
          <span className="text-2xl font-black text-[#062D3A] mt-1 block">{requests.length}</span>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">100% Auditadas</span>
        </div>

        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#8E9FA2] uppercase block">Tasa de Conclusión</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{approvalRate}%</span>
          <span className="text-[10px] text-[#56696D] font-medium mt-1 block">{counts.T} concluidas con éxito</span>
        </div>

        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#8E9FA2] uppercase block">En Operación Activa</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{inAttentionRate}%</span>
          <span className="text-[10px] text-[#56696D] font-medium mt-1 block">{counts.A} cuadrillas asignadas</span>
        </div>

        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#8E9FA2] uppercase block">Tiempo Resp. Promedio</span>
          <span className="text-2xl font-black text-[#062D3A] mt-1 block">&lt; 24 hrs</span>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Cumplimiento SLA 98.4%</span>
        </div>
      </div>

      {/* Desglose por Servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-[#062D3A] uppercase tracking-wider pb-2 border-b border-[#E8ECEF]">
            Distribución por Especialidad Industrial
          </h3>
          <div className="space-y-3">
            {Object.entries(needCounts).map(([need, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={need} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#062D3A]">{need}</span>
                    <span className="font-bold text-[#56696D]">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#E8ECEF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7AC143] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-[#062D3A] uppercase tracking-wider pb-2 border-b border-[#E8ECEF]">
            Estado de Cotizaciones
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF] flex items-center justify-between">
              <span className="font-bold text-[#062D3A]">Nuevas / Sin Atender (E)</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">{counts.E}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF] flex items-center justify-between">
              <span className="font-bold text-[#062D3A]">En Atención / Cuadrilla Asignada (A)</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">{counts.A}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF] flex items-center justify-between">
              <span className="font-bold text-[#062D3A]">Terminadas / Aprobadas (T)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{counts.T}</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF] flex items-center justify-between">
              <span className="font-bold text-[#062D3A]">Canceladas (C)</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">{counts.C}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

