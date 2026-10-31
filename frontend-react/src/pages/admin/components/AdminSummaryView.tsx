import React from 'react';
import type { ServiceRequest, DashboardCounts } from '../../../types';
import { MetricsCards } from '../../../components/common/MetricsCards';
import { STATUS_CONFIG, formatDate, formatNeed } from '../../../utils/formatters';

interface AdminSummaryViewProps {
  userName?: string;
  counts: DashboardCounts;
  requests: ServiceRequest[];
  onSelectRequest: (requestId: string) => void;
  onViewAllRequests: () => void;
  onNavigateToUsers: () => void;
  onNavigateToNotes: () => void;
}

export const AdminSummaryView: React.FC<AdminSummaryViewProps> = ({
  userName = 'Administrador',
  counts,
  requests,
  onSelectRequest,
  onViewAllRequests,
  onNavigateToUsers,
  onNavigateToNotes,
}) => {
  const firstName = userName.trim().split(' ')[0] || 'Administrador';
  const top5 = requests.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-[#062D3A] via-[#082F3D] to-[#0C3E4F] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <span className="w-2 h-2 rounded-full bg-[#7AC143]" />
            <span>Supervisión Central de Operaciones</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Panel de Control, <span className="text-[#7AC143]">{firstName}</span>
          </h1>
          <p className="text-[#D2E2E5] text-xs md:text-sm mt-2 leading-relaxed">
            Supervisa el estado global de servicios a nivel nacional, coordina la asignación de operadores y gestiona las cuentas del sistema.
          </p>
        </div>
      </div>

      {/* Métricas Globales */}
      <MetricsCards counts={counts} totalLabel="Total Plataforma" />

      {/* Accesos Rápidos de Administración */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={onViewAllRequests}
          className="p-4 bg-white border border-[#E8ECEF] rounded-xl shadow-xs text-left hover:border-[#7AC143] transition-colors cursor-pointer group"
        >
          <div className="text-xl mb-1">📑</div>
          <div className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
            Asignar Operadores
          </div>
          <p className="text-[11px] text-[#56696D] mt-0.5">
            Revisa solicitudes pendientes y delega especialistas en sitio.
          </p>
        </button>

        <button
          type="button"
          onClick={onNavigateToNotes}
          className="p-4 bg-white border border-[#E8ECEF] rounded-xl shadow-xs text-left hover:border-[#7AC143] transition-colors cursor-pointer group"
        >
          <div className="text-xl mb-1">📋</div>
          <div className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
            Bitácora Central
          </div>
          <p className="text-[11px] text-[#56696D] mt-0.5">
            Supervisa los reportes de avances y notas técnicas registradas.
          </p>
        </button>

        <button
          type="button"
          onClick={onNavigateToUsers}
          className="p-4 bg-white border border-[#E8ECEF] rounded-xl shadow-xs text-left hover:border-[#7AC143] transition-colors cursor-pointer group"
        >
          <div className="text-xl mb-1">👥</div>
          <div className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
            Cuentas y Especialistas
          </div>
          <p className="text-[11px] text-[#56696D] mt-0.5">
            Administra los usuarios con rol de cliente, operador y administrador.
          </p>
        </button>
      </div>

      {/* Tabla de Solicitudes Recientes de la Plataforma */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8ECEF] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#062D3A]">Últimas Solicitudes Registradas</h3>
            <p className="text-xs text-[#56696D]">Monitoreo de ingresos de servicios a nivel nacional</p>
          </div>
          <button
            type="button"
            onClick={onViewAllRequests}
            className="text-xs font-bold text-[#062D3A] hover:text-[#7AC143] cursor-pointer"
          >
            Ver todas ({requests.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#56696D] font-bold border-b border-[#E8ECEF]">
              <tr>
                <th className="p-3.5">Folio</th>
                <th className="p-3.5">Cliente / Empresa</th>
                <th className="p-3.5">Especialidad</th>
                <th className="p-3.5">Operador Asignado</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEF]">
              {top5.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#8E9FA2] italic">
                    No existen solicitudes registradas en la base de datos actualmente.
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
                      <td className="p-3.5 text-[#062D3A] font-semibold">
                        {r.OperatorName ? `🛠️ ${r.OperatorName}` : <span className="text-[#8E9FA2] italic">Sin asignar</span>}
                      </td>
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
                          Gestionar
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

