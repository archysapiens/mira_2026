import React from 'react';
import type { ServiceRequest, DashboardCounts } from '../../../types';
import { MetricsCards } from '../../../components/common/MetricsCards';
import { STATUS_CONFIG, formatDate, formatNeed } from '../../../utils/formatters';

interface OperatorSummaryViewProps {
  userName?: string;
  counts: DashboardCounts;
  requests: ServiceRequest[];
  onSelectRequest: (requestId: string) => void;
  onViewAllRequests: () => void;
}

export const OperatorSummaryView: React.FC<OperatorSummaryViewProps> = ({
  userName = 'Operador',
  counts,
  requests,
  onSelectRequest,
  onViewAllRequests,
}) => {
  const firstName = userName.trim().split(' ')[0] || 'Operador';
  const todayLabel = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Servicio activo: el que esté en 'A' (En atención) o el primero de la lista
  const activeService = requests.find((r) => r.Status === 'A') || requests[0] || null;

  // Horarios dinámicos para la agenda del día
  const scheduleSlots = ['09:00', '11:30', '15:00', '17:00'];
  const todaySchedule = requests.slice(0, 3);

  const top5 = requests.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-[#062D3A] to-[#0C3E4F] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <span className="w-2 h-2 rounded-full bg-[#7AC143]" />
            <span>Jornada Operativa Activa</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ¡Buen día, <span className="text-[#7AC143]">{firstName}</span>!
          </h1>
          <p className="text-[#D2E2E5] text-xs md:text-sm mt-2 leading-relaxed">
            Gestiona tus servicios asignados, actualiza el estado de las órdenes en sitio y mantén la bitácora técnica al día.
          </p>
        </div>
      </div>

      {/* Métricas Cuantitativas */}
      <MetricsCards counts={counts} totalLabel="Servicios Asignados" />

      {/* Grid Principal: Servicio en curso (70%) + Agenda de hoy (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Servicio en Curso */}
        <div className="lg:col-span-8 bg-white border border-[#E8ECEF] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
            <div>
              <span className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
                SERVICIO EN CURSO
              </span>
              <h3 className="text-lg font-bold text-[#062D3A]">
                {activeService ? activeService.Folio : 'Sin servicio en atención'}
              </h3>
            </div>
            {activeService && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  STATUS_CONFIG[activeService.Status]?.badgeClass || 'bg-gray-100 text-gray-700'
                }`}
              >
                {STATUS_CONFIG[activeService.Status]?.label || activeService.Status}
              </span>
            )}
          </div>

          {activeService ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] block text-[11px]">Cliente / Empresa:</span>
                  <span className="font-bold text-[#062D3A] text-sm mt-0.5 block">
                    {activeService.Company || activeService.ContactName}
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] block text-[11px]">Especialidad Requerida:</span>
                  <span className="font-bold text-[#062D3A] text-sm mt-0.5 block">
                    {formatNeed(activeService.Need)}
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] block text-[11px]">Ubicación del Servicio:</span>
                  <span className="font-bold text-[#062D3A] text-xs mt-0.5 block truncate">
                    📍 {activeService.Location || 'No especificada'}
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] block text-[11px]">Fecha Asignación:</span>
                  <span className="font-bold text-[#062D3A] text-xs mt-0.5 block">
                    📅 {formatDate(activeService.CreatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[#56696D]">
                  Registra tus notas técnicas de campo y concluye el servicio cuando finalices.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectRequest(activeService.RequestId)}
                  className="px-4 py-2 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Abrir detalle y bitácora →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#8E9FA2] italic">
              No tienes servicios asignados en este momento.
            </div>
          )}
        </div>

        {/* Columna Derecha: Agenda del Día */}
        <div className="lg:col-span-4 bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
            <h4 className="text-sm font-bold text-[#062D3A] flex items-center gap-1.5">
              <span>📅</span>
              <span>Mi Jornada de Hoy</span>
            </h4>
            <span className="text-[11px] font-semibold text-[#8E9FA2]">{todayLabel}</span>
          </div>

          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8E9FA2] italic">
                Sin actividades programadas para hoy.
              </div>
            ) : (
              todaySchedule.map((req, idx) => (
                <div
                  key={req.RequestId}
                  className="flex items-start gap-3 p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg text-xs"
                >
                  <span className="px-2 py-1 bg-white border border-[#E8ECEF] rounded text-[11px] font-bold text-[#062D3A]">
                    {scheduleSlots[idx] || '09:00'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#062D3A] truncate">{formatNeed(req.Need)}</p>
                    <p className="text-[11px] text-[#56696D] truncate">
                      {req.Company || req.ContactName} · 📍 {req.Location}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Servicios Recientes Asignados */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8ECEF] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#062D3A]">Servicios Asignados Recientes</h3>
            <p className="text-xs text-[#56696D]">Últimas solicitudes puestas bajo tu responsabilidad técnica</p>
          </div>
          <button
            type="button"
            onClick={onViewAllRequests}
            className="text-xs font-bold text-[#062D3A] hover:text-[#7AC143] cursor-pointer"
          >
            Ver todos ({requests.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#56696D] font-bold border-b border-[#E8ECEF]">
              <tr>
                <th className="p-3.5">Folio</th>
                <th className="p-3.5">Cliente / Empresa</th>
                <th className="p-3.5">Necesidad</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEF]">
              {top5.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#8E9FA2] italic">
                    No tienes servicios asignados actualmente en el sistema.
                  </td>
                </tr>
              ) : (
                top5.map((r) => {
                  const cfg = STATUS_CONFIG[r.Status] || { label: r.Status, badgeClass: 'bg-gray-100' };
                  return (
                    <tr key={r.RequestId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-bold text-[#062D3A]">{r.Folio}</td>
                      <td className="p-3.5 font-medium">{r.Company || r.ContactName}</td>
                      <td className="p-3.5 text-[#56696D]">{formatNeed(r.Need)}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#8E9FA2]">{formatDate(r.CreatedAt)}</td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectRequest(r.RequestId)}
                          className="px-3 py-1 bg-[#F4F7F9] hover:bg-[#E8ECEF] text-[#062D3A] font-bold rounded cursor-pointer"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

