import React, { useState, useEffect } from 'react';
import type { ServiceRequest, WorkNote, RequestStatus } from '../../../types';
import {
  formatNeed,
  formatDescription,
  formatDate,
  extractRequestedDate,
  STATUS_CONFIG,
} from '../../../utils/formatters';
import { requestsApi } from '../../../api/requests';

interface RequestsViewProps {
  requests: ServiceRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  requests,
  selectedRequestId,
  onSelectRequest,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Filtrado y búsqueda
  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    const folio = (r.Folio || '').toLowerCase();
    const needText = formatNeed(r.Need).toLowerCase();
    const rawNeed = (r.Need || '').toLowerCase();
    const matchesSearch = !term || folio.includes(term) || needText.includes(term) || rawNeed.includes(term);
    const matchesStatus = statusFilter === 'ALL' || r.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedRequest = requests.find((r) => r.RequestId === selectedRequestId) || null;

  // Cargar notas al cambiar solicitud seleccionada
  useEffect(() => {
    let isCancelled = false;
    if (selectedRequest) {
      setIsLoadingNotes(true);
      requestsApi
        .getNotes(selectedRequest.RequestId)
        .then((data) => {
          if (!isCancelled) {
            setNotes(Array.isArray(data) ? data : []);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setNotes([]);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingNotes(false);
          }
        });
    } else {
      setNotes([]);
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedRequest]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#062D3A] leading-tight">
            Mis Solicitudes
          </h2>
          <p className="text-xs sm:text-sm text-[#56696D] mt-1">
            Consulta el estado técnico, avance y asignación de cada servicio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshClick}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-[#E8ECEF] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <span>{isRefreshing ? 'Actualizando...' : '🔄 Actualizar'}</span>
        </button>
      </div>

      {/* Grid 35% lista / 65% detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel izquierdo: Lista con controles (35% ~ 4-5 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Controles de Búsqueda y Filtro */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E8ECEF] space-y-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio o necesidad..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] focus:ring-1 focus:ring-[#7AC143]"
              data-testid="request-search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | RequestStatus)}
              className="w-full px-3 py-2 text-xs font-semibold text-[#062D3A] bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
              data-testid="status-filter-select"
            >
              <option value="ALL">Todos los estados</option>
              <option value="E">Enviadas (E)</option>
              <option value="A">En atención (A)</option>
              <option value="T">Terminadas (T)</option>
              <option value="C">Canceladas (C)</option>
            </select>

            <div className="text-[11px] font-bold text-[#8E9FA2]" data-testid="requests-count-label">
              {filteredRequests.length} solicitud{filteredRequests.length === 1 ? '' : 'es'}
            </div>
          </div>

          {/* Lista scrolleable de solicitudes */}
          <div className="max-h-[640px] overflow-y-auto divide-y divide-[#F1F5F9]" data-testid="requests-list-container">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#8E9FA2]" role="status">
                Cargando solicitudes...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E9FA2]">
                No se encontraron solicitudes con los filtros aplicados.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.RequestId === selectedRequestId;
                const cfg = STATUS_CONFIG[req.Status] || STATUS_CONFIG.E;
                return (
                  <button
                    key={req.RequestId}
                    type="button"
                    onClick={() => onSelectRequest(req.RequestId)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDF4] border-l-4 border-[#7AC143] pl-3'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                    data-testid={`request-item-${req.Folio}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[11px] font-mono font-bold text-[#062D3A]">
                        {req.Folio}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#062D3A] line-clamp-1 leading-snug">
                      {formatNeed(req.Need)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#8E9FA2] mt-1.5">
                      <span>📅 {formatDate(req.CreatedAt)}</span>
                      <span className="truncate">📍 {req.Location || 'Nacional'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel derecho: Detalle Técnico (65% ~ 7-8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E8ECEF] rounded-xl p-6 md:p-8 shadow-xs min-h-[560px]" data-testid="request-detail-panel">
          {!selectedRequest ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EEF7E6] text-[#7AC143] flex items-center justify-center mx-auto text-xl">
                📋
              </div>
              <h3 className="text-lg font-extrabold text-[#062D3A]">
                Selecciona una solicitud
              </h3>
              <p className="text-xs text-[#56696D] max-w-sm mx-auto leading-relaxed">
                Haz clic en cualquier solicitud de la lista izquierda para consultar su detalle técnico, estado y notas de avance.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header del Detalle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8ECEF] gap-3">
                <div>
                  <span className="text-[10.5px] font-extrabold text-[#00875A] tracking-wider uppercase">
                    SEGUIMIENTO DE SERVICIO
                  </span>
                  <h2 className="text-2xl font-black text-[#062D3A] tracking-tight mt-0.5" data-testid="detail-folio">
                    {selectedRequest.Folio}
                  </h2>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      (STATUS_CONFIG[selectedRequest.Status] || STATUS_CONFIG.E).badgeClass
                    }`}
                  >
                    {(STATUS_CONFIG[selectedRequest.Status] || STATUS_CONFIG.E).label}
                  </span>
                </div>
              </div>

              {/* Progress Tracker Visual */}
              {selectedRequest.Status === 'C' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Esta solicitud fue cancelada. Si necesitas reactivarla, por favor genera una nueva cotización.</span>
                </div>
              ) : (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#047857] font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#7AC143] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    <span>1. Solicitud Recibida</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#CBD5E1]" />
                  <div
                    className={`flex items-center gap-2 font-bold ${
                      selectedRequest.Status === 'A' || selectedRequest.Status === 'T'
                        ? 'text-[#047857]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        selectedRequest.Status === 'A' || selectedRequest.Status === 'T'
                          ? 'bg-[#7AC143] text-white'
                          : 'bg-[#E2E8F0] text-gray-500'
                      }`}
                    >
                      {selectedRequest.Status === 'A' || selectedRequest.Status === 'T' ? '✓' : '2'}
                    </span>
                    <span>2. En Atención</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#CBD5E1]" />
                  <div
                    className={`flex items-center gap-2 font-bold ${
                      selectedRequest.Status === 'T' ? 'text-[#047857]' : 'text-[#94A3B8]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        selectedRequest.Status === 'T' ? 'bg-[#7AC143] text-white' : 'bg-[#E2E8F0] text-gray-500'
                      }`}
                    >
                      {selectedRequest.Status === 'T' ? '✓' : '3'}
                    </span>
                    <span>3. Concluida</span>
                  </div>
                </div>
              )}

              {/* Grid de Propiedades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Fecha de Registro
                  </div>
                  <div className="text-xs font-bold text-[#062D3A] mt-1">
                    {formatDate(selectedRequest.CreatedAt)}
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Fecha Requerida
                  </div>
                  <div className="text-xs font-bold text-[#062D3A] mt-1">
                    {extractRequestedDate(selectedRequest.Description) || formatDate(selectedRequest.CreatedAt)}
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Ubicación del Servicio
                  </div>
                  <div className="text-xs font-bold text-[#062D3A] mt-1 truncate">
                    {selectedRequest.Location || 'No especificada'}
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Especialista MIRA Asignado
                  </div>
                  <div className="text-xs font-bold text-[#062D3A] mt-1">
                    {selectedRequest.OperatorName ? `🛠️ ${selectedRequest.OperatorName}` : 'Pendiente de asignación'}
                  </div>
                </div>

                <div className="md:col-span-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Empresa / Titular
                  </div>
                  <div className="text-xs font-bold text-[#062D3A] mt-1">
                    {selectedRequest.Company
                      ? `${selectedRequest.Company} (${selectedRequest.ContactName || 'Titular'})`
                      : selectedRequest.ContactName || '-'}
                  </div>
                </div>

                <div className="md:col-span-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Servicio / Necesidad Reportada
                  </div>
                  <div className="text-sm font-bold text-[#062D3A] mt-1">
                    {formatNeed(selectedRequest.Need)}
                  </div>
                </div>

                <div className="md:col-span-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
                  <div className="text-[10.5px] font-extrabold text-[#8E9FA2] uppercase tracking-wider">
                    Descripción Técnica Proporcionada
                  </div>
                  <div className="text-xs text-[#062D3A] leading-relaxed whitespace-pre-line mt-1.5">
                    {formatDescription(selectedRequest.Description)}
                  </div>
                </div>
              </div>

              {/* Sección de Historial y Notas de Trabajo */}
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
                <h4 className="text-xs font-extrabold text-[#062D3A] flex items-center gap-1.5">
                  <span>📝</span>
                  <span>Notas y Seguimiento Técnico</span>
                </h4>
                {isLoadingNotes ? (
                  <p className="text-[11px] text-[#8E9FA2]">Cargando notas...</p>
                ) : notes.length === 0 ? (
                  <p className="text-[11px] text-[#8E9FA2]">
                    Sin notas adicionales registradas para este servicio.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div key={n.WorkNoteId} className="p-2.5 bg-white rounded border border-[#E2E8F0] text-xs">
                        <div className="flex justify-between text-[10px] text-[#8E9FA2] mb-1">
                          <span className="font-bold text-[#062D3A]">{n.Author}</span>
                          <span>{formatDate(n.CreatedAt)}</span>
                        </div>
                        <p className="text-xs text-[#56696D]">{n.Note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
