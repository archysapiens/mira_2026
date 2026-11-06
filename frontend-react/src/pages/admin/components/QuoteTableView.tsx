import React, { useState } from 'react';
import type { ServiceRequest } from '../../../types';
import { formatDate, formatNeed } from '../../../utils/formatters';

interface QuoteTableViewProps {
  requests: ServiceRequest[];
  filteredRequests: ServiceRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  sortOrder: 'desc' | 'asc';
  onToggleSortOrder: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onNewQuote?: () => void;
}

// Badges visuales compactos para estados de cotizaciones
export const getStatusVisualBadge = (status: string, operatorName?: string | null) => {
  switch (status) {
    case 'E':
      if (operatorName) {
        return {
          label: 'En revisión',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
        };
      }
      return {
        label: 'Nueva',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'A':
      return {
        label: 'Asignada',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
      };
    case 'T':
      return {
        label: 'Aprobada',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'C':
      return {
        label: 'Cancelada',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        dotClass: 'bg-gray-400',
      };
  }
};

export const getUrgencyVisualBadge = (urgency?: string | null) => {
  const norm = (urgency || 'Media').toLowerCase();
  if (norm.includes('alt') || norm.includes('urg')) {
    return {
      label: urgency || 'Alta',
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
      dotClass: 'bg-rose-500',
      icon: '🔴',
    };
  }
  if (norm.includes('baj')) {
    return {
      label: urgency || 'Baja',
      badgeClass: 'text-slate-600 bg-slate-50 border-slate-200',
      dotClass: 'bg-slate-400',
      icon: '⚪',
    };
  }
  return {
    label: urgency || 'Media',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
    icon: '🟡',
  };
};

export const QuoteTableView: React.FC<QuoteTableViewProps> = ({
  requests,
  filteredRequests,
  selectedRequestId,
  onSelectRequest,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  activeTab,
  onTabChange,
  sortOrder,
  onToggleSortOrder,
  isLoading,
  isRefreshing,
  onRefresh,
  onNewQuote,
}) => {
  // Paginación compacta
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const currentItems = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // Contadores dinámicos calculados a partir de los datos
  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.Status === 'E' && !r.OperatorName).length,
    review: requests.filter((r) => r.Status === 'E').length,
    assigned: requests.filter((r) => r.Status === 'A' || !!r.OperatorName).length,
    quoted: requests.filter((r) => r.Status === 'A' || r.Status === 'T').length,
    approved: requests.filter((r) => r.Status === 'T').length,
    cancelled: requests.filter((r) => r.Status === 'C').length,
  };

  const tabs = [
    { id: 'ALL', label: 'Todas', count: counts.all },
    { id: 'NEW', label: 'Nuevas', count: counts.new },
    { id: 'REVIEW', label: 'En revisión', count: counts.review },
    { id: 'ASSIGNED', label: 'Asignadas', count: counts.assigned },
    { id: 'QUOTED', label: 'Cotizadas', count: counts.quoted },
    { id: 'APPROVED', label: 'Aprobadas', count: counts.approved },
    { id: 'CANCELLED', label: 'Canceladas', count: counts.cancelled },
  ];

  return (
    <div id="tabla-cotizaciones" className="space-y-3">
      {/* 1. Barra de Búsqueda y Botones de Acción */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Buscador Principal */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8E9FA2] text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por folio, cliente, empresa, necesidad u operador..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] focus:bg-white transition-colors"
            data-testid="admin-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-2 flex items-center text-[#8E9FA2] hover:text-[#062D3A] text-xs cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botones Filtros y Nueva Cotización */}
        <div className="flex items-center gap-2 self-end sm:self-auto relative">
          {/* Botón Filtros con Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                statusFilter !== 'ALL' || showFilterDropdown
                  ? 'border-[#7AC143] bg-[#EEF7E6] text-[#062D3A]'
                  : 'border-[#E8ECEF] bg-white hover:bg-[#F8FAFC] text-[#56696D]'
              }`}
            >
              <span>⚙️ Filtros</span>
              {statusFilter !== 'ALL' && (
                <span className="w-2 h-2 rounded-full bg-[#7AC143]" />
              )}
            </button>

            {/* Panel Popover de Filtros Avanzados */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E8ECEF] rounded-xl shadow-lg p-3 z-30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E8ECEF] pb-1.5">
                  <span className="text-xs font-bold text-[#062D3A]">Filtros de Lista</span>
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="text-xs text-[#8E9FA2] hover:text-[#062D3A]"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#56696D] block mb-1">
                    Estado de la solicitud
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      onStatusFilterChange(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg text-[#062D3A]"
                    data-testid="admin-status-filter"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="E">Enviadas / Sin atender (E)</option>
                    <option value="A">En atención / Proceso (A)</option>
                    <option value="T">Terminadas / Concluidas (T)</option>
                    <option value="C">Canceladas (C)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#56696D] block mb-1">
                    Orden por fecha
                  </label>
                  <button
                    type="button"
                    onClick={onToggleSortOrder}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg text-left font-semibold text-[#062D3A]"
                  >
                    {sortOrder === 'desc' ? '⬇ Más recientes primero' : '⬆ Más antiguas primero'}
                  </button>
                </div>

                <div className="pt-1 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      onStatusFilterChange('ALL');
                      onSearchChange('');
                    }}
                    className="text-[11px] text-[#56696D] hover:underline"
                  >
                    Restablecer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-2.5 py-1 text-xs font-bold bg-[#062D3A] text-white rounded"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botón Actualizar */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="p-1.5 text-xs font-semibold rounded-lg border border-[#E8ECEF] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer"
            title="Actualizar listado"
          >
            {isRefreshing ? '...' : '🔄'}
          </button>

          {/* Botón Nueva Cotización */}
          <button
            type="button"
            onClick={onNewQuote || (() => alert('Para registrar una nueva cotización como cliente, usa el cotizador en el portal principal.'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#7AC143] bg-[#7AC143] text-white hover:bg-[#68a737] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>+</span>
            <span>Nueva cotización</span>
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Estado Compactas con Contadores */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin pb-1">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTabChange(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#062D3A] text-white shadow-2xs'
                    : 'bg-white border border-[#E8ECEF] text-[#56696D] hover:text-[#062D3A] hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-[#7AC143] text-white'
                      : 'bg-[#F0F2F4] text-[#56696D]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contador dinámico compatible con tests */}
        <span className="text-[11px] font-semibold text-[#8E9FA2] whitespace-nowrap hidden lg:block">
          {filteredRequests.length} solicitud{filteredRequests.length === 1 ? '' : 'es'} en plataforma
        </span>
      </div>

      {/* 3. Tabla Compacta de Cotizaciones */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E8ECEF] text-[11px] font-bold text-[#56696D] uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-36">Folio</th>
                <th className="py-2.5 px-3.5">Cliente</th>
                <th className="py-2.5 px-3.5">Servicio</th>
                <th className="py-2.5 px-3.5 w-28">Fecha</th>
                <th className="py-2.5 px-3.5 w-28">Estado</th>
                <th className="py-2.5 px-3.5 w-24">Prioridad</th>
                <th className="py-2.5 px-3.5 w-36">Asignado a</th>
                <th className="py-2.5 px-3.5 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEF]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#8E9FA2]">
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Cargando cotizaciones...</span>
                    </span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#8E9FA2] italic">
                    No se encontraron cotizaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                currentItems.map((req) => {
                  const isSelected = req.RequestId === selectedRequestId;
                  const statusBadge = getStatusVisualBadge(req.Status, req.OperatorName);
                  const urgencyBadge = getUrgencyVisualBadge(req.Urgency);
                  const targetUrl = `/admin/cotizaciones/${req.RequestId}`;

                  return (
                    <tr
                      key={req.RequestId}
                      onClick={() => onSelectRequest(req.RequestId)}
                      className={`transition-colors group hover:bg-[#F8FAFC] ${
                        isSelected ? 'bg-[#EEF7E6]/40' : ''
                      }`}
                    >
                      {/* 1. Folio con enlace a nueva pestaña */}
                      <td className="py-2.5 px-3.5 font-mono font-bold whitespace-nowrap">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req.RequestId);
                          }}
                          className="inline-flex items-center gap-1 text-[#062D3A] hover:text-[#7AC143] group-hover:underline cursor-pointer"
                          title={`Abrir expediente ${req.Folio} en nueva pestaña`}
                        >
                          <span>{req.Folio}</span>
                          <span className="text-[10px] text-[#8E9FA2] group-hover:text-[#7AC143]">↗</span>
                        </a>
                      </td>

                      {/* 2. Cliente y Empresa */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-[#062D3A] truncate max-w-[200px]">
                          {req.Company || req.ContactName}
                        </div>
                        {req.Company && req.ContactName && (
                          <div className="text-[10px] text-[#8E9FA2] truncate max-w-[200px]">
                            {req.ContactName}
                          </div>
                        )}
                      </td>

                      {/* 3. Servicio */}
                      <td className="py-2.5 px-3.5">
                        <span className="font-medium text-[#062D3A] truncate block max-w-[200px]">
                          {formatNeed(req.Need)}
                        </span>
                      </td>

                      {/* 4. Fecha */}
                      <td className="py-2.5 px-3.5 text-[#56696D] whitespace-nowrap text-[11px]">
                        {formatDate(req.CreatedAt)}
                      </td>

                      {/* 5. Estado */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>

                      {/* 6. Prioridad */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${urgencyBadge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgencyBadge.dotClass}`} />
                          <span>{urgencyBadge.label}</span>
                        </span>
                      </td>

                      {/* 7. Asignado a */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {req.OperatorName ? (
                          <span className="text-[#062D3A] font-semibold truncate block max-w-[130px]">
                            {req.OperatorName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8E9FA2] italic">Sin asignar</span>
                        )}
                      </td>

                      {/* 8. Acciones (Enlace a nueva pestaña) */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req.RequestId);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#062D3A] hover:bg-[#7AC143] text-white text-[11px] font-bold transition-colors cursor-pointer"
                          title="Abrir expediente en nueva pestaña"
                        >
                          <span>Expediente</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Paginación Compacta */}
        {filteredRequests.length > 0 && (
          <div className="p-3 bg-[#F8FAFC] border-t border-[#E8ECEF] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#56696D]">
            <div>
              Mostrando{' '}
              <span className="font-bold text-[#062D3A]">
                {startIndex + 1}
              </span>{' '}
              a{' '}
              <span className="font-bold text-[#062D3A]">
                {Math.min(startIndex + itemsPerPage, filteredRequests.length)}
              </span>{' '}
              de{' '}
              <span className="font-bold text-[#062D3A]">
                {filteredRequests.length}
              </span>{' '}
              cotizaciones
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-[#E8ECEF] bg-white hover:bg-gray-50 disabled:opacity-40 font-semibold cursor-pointer text-xs"
              >
                ← Anterior
              </button>

              <span className="px-2 text-xs font-bold text-[#062D3A]">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 rounded border border-[#E8ECEF] bg-white hover:bg-gray-50 disabled:opacity-40 font-semibold cursor-pointer text-xs"
              >
                Siguiente →
              </button>

              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-2 px-1.5 py-0.5 text-xs bg-white border border-[#E8ECEF] rounded text-[#062D3A]"
              >
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
