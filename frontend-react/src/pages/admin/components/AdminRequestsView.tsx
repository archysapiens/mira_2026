import React, { useState, useEffect } from 'react';
import type { ServiceRequest, RequestStatus, WorkNote, SystemUser } from '../../../types';
import { requestsApi } from '../../../api/requests';
import { STATUS_CONFIG, formatDate, formatNeed, extractRequestedDate } from '../../../utils/formatters';
import { StatusTracker } from '../../../components/common/StatusTracker';
import { OperatorAssignSelector } from '../../../components/common/OperatorAssignSelector';
import { StatusUpdateSelector } from '../../../components/common/StatusUpdateSelector';
import { WorkNotesSection } from '../../../components/common/WorkNotesSection';

interface AdminRequestsViewProps {
  requests: ServiceRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  operators: SystemUser[];
  onDataChanged?: () => Promise<void>;
}

export const AdminRequestsView: React.FC<AdminRequestsViewProps> = ({
  requests,
  selectedRequestId,
  onSelectRequest,
  onRefresh,
  isLoading,
  operators,
  onDataChanged,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notas de la solicitud seleccionada
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filtrado y búsqueda
  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    const folio = (r.Folio || '').toLowerCase();
    const need = (r.Need || '').toLowerCase();
    const contact = (r.ContactName || '').toLowerCase();
    const company = (r.Company || '').toLowerCase();
    const location = (r.Location || '').toLowerCase();
    const operator = (r.OperatorName || '').toLowerCase();

    const matchesSearch =
      !term ||
      folio.includes(term) ||
      need.includes(term) ||
      contact.includes(term) ||
      company.includes(term) ||
      location.includes(term) ||
      operator.includes(term);

    const matchesStatus = statusFilter === 'ALL' || r.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedRequest = requests.find((r) => r.RequestId === selectedRequestId) || null;

  // Cargar notas al cambiar la solicitud seleccionada
  useEffect(() => {
    let isCancelled = false;
    if (selectedRequest) {
      setIsLoadingNotes(true);
      requestsApi
        .getNotes(selectedRequest.RequestId)
        .then((data) => {
          if (!isCancelled) setNotes(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!isCancelled) setNotes([]);
        })
        .finally(() => {
          if (!isCancelled) setIsLoadingNotes(false);
        });
    } else {
      setNotes([]);
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedRequest]);

  // Asignar operador a la solicitud (ADMIN)
  const handleAssignOperator = async (operatorId: string) => {
    if (!selectedRequest) return;
    setIsAssigning(true);
    setActionFeedback(null);
    try {
      await requestsApi.assignOperator(selectedRequest.RequestId, operatorId);
      setActionFeedback({ message: '✓ Especialista asignado exitosamente y estado cambiado a "En atención".', type: 'success' });
      if (onDataChanged) {
        await onDataChanged();
      } else {
        await onRefresh();
      }
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al asignar operador';
      setActionFeedback({ message: msg, type: 'error' });
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  // Actualizar estado de la solicitud (ADMIN)
  const handleUpdateStatus = async (newStatus: RequestStatus, comment?: string) => {
    if (!selectedRequest) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      await requestsApi.updateStatus(selectedRequest.RequestId, newStatus, comment);
      setActionFeedback({ message: `✓ Estado actualizado a "${STATUS_CONFIG[newStatus]?.label || newStatus}"`, type: 'success' });
      if (onDataChanged) {
        await onDataChanged();
      } else {
        await onRefresh();
      }
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      setActionFeedback({ message: msg, type: 'error' });
      throw err;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Agregar nota técnica a la bitácora (ADMIN)
  const handleAddNote = async (noteText: string) => {
    if (!selectedRequest) return;
    await requestsApi.addNote(selectedRequest.RequestId, noteText);
    const updated = await requestsApi.getNotes(selectedRequest.RequestId);
    setNotes(Array.isArray(updated) ? updated : []);
  };

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
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#062D3A] leading-tight">
            Gestión Central de Solicitudes
          </h2>
          <p className="text-xs sm:text-sm text-[#56696D] mt-1">
            Asigna operadores de campo, audita los avances técnicos y actualiza los estatus.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshClick}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-[#E8ECEF] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <span>{isRefreshing ? 'Actualizando...' : '🔄 Actualizar lista'}</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* Grid 35% lista / 65% detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Lista y Filtros */}
        <div className="lg:col-span-4 bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Controles de Búsqueda y Filtro */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E8ECEF] space-y-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente, necesidad u operador..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
              data-testid="admin-search-input"
            />

            <div className="flex items-center justify-between gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] text-[#062D3A]"
                data-testid="admin-status-filter"
              >
                <option value="ALL">Todos los estados</option>
                <option value="E">Enviadas / Sin atender (E)</option>
                <option value="A">En atención / Proceso (A)</option>
                <option value="T">Terminadas / Concluidas (T)</option>
                <option value="C">Canceladas (C)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8E9FA2]">
              <span>
                {filteredRequests.length} solicitud{filteredRequests.length === 1 ? '' : 'es'} en plataforma
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[#062D3A] hover:underline cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>

          {/* Lista de Solicitudes */}
          <div className="divide-y divide-[#E8ECEF] max-h-[580px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#8E9FA2]" role="status">
                Cargando solicitudes...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E9FA2] italic">
                No se encontraron solicitudes con los filtros aplicados.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.RequestId === selectedRequestId;
                const cfg = STATUS_CONFIG[req.Status] || { label: req.Status, badgeClass: 'bg-gray-100' };

                return (
                  <button
                    key={req.RequestId}
                    type="button"
                    onClick={() => onSelectRequest(req.RequestId)}
                    className={`w-full p-4 text-left transition-colors cursor-pointer space-y-1.5 ${
                      isSelected ? 'bg-[#EEF7E6] border-l-4 border-[#7AC143]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#062D3A] tracking-tight">
                        {req.Folio}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#062D3A] truncate">
                      {formatNeed(req.Need)}
                    </div>

                    <div className="text-[11px] text-[#56696D] truncate">
                      🏢 {req.Company || req.ContactName}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8E9FA2] pt-1">
                      <span className="truncate max-w-[140px]">
                        {req.OperatorName ? `🛠️ ${req.OperatorName}` : '⚠️ Sin asignar'}
                      </span>
                      <span>📅 {formatDate(req.CreatedAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho: Detalle, Asignación y Bitácora */}
        <div className="lg:col-span-8 bg-white border border-[#E8ECEF] rounded-xl p-6 shadow-xs space-y-6">
          {!selectedRequest ? (
            <div className="p-16 text-center text-xs text-[#8E9FA2] italic">
              Selecciona una solicitud de la lista izquierda para consultar y coordinar su atención.
            </div>
          ) : (
            <>
              {/* Encabezado del Detalle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8ECEF]">
                <div>
                  <span className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
                    DETALLE DE GESTIÓN ADMINISTRATIVA
                  </span>
                  <h3 className="text-2xl font-black text-[#062D3A] tracking-tight">
                    {selectedRequest.Folio}
                  </h3>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedRequest.Status]?.badgeClass || 'bg-gray-100'
                    }`}
                  >
                    {STATUS_CONFIG[selectedRequest.Status]?.label || selectedRequest.Status}
                  </span>
                </div>
              </div>

              {/* Status Tracker */}
              <StatusTracker status={selectedRequest.Status} />

              {/* Módulo Exclusivo Admin: Asignación de Operadores */}
              <OperatorAssignSelector
                currentOperatorName={selectedRequest.OperatorName}
                operators={operators}
                isAssigning={isAssigning}
                onAssign={handleAssignOperator}
              />

              {/* Actualización de Estado (Admin) */}
              <StatusUpdateSelector
                currentStatus={selectedRequest.Status}
                isUpdating={isUpdatingStatus}
                onUpdateStatus={handleUpdateStatus}
              />

              {/* Cuadrícula de Propiedades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] text-[11px] block">Cliente / Empresa:</span>
                  <span className="font-bold text-[#062D3A] text-sm mt-0.5 block">
                    {selectedRequest.Company
                      ? `${selectedRequest.Company} (${selectedRequest.ContactName})`
                      : selectedRequest.ContactName}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] text-[11px] block">Necesidad Reportada:</span>
                  <span className="font-bold text-[#062D3A] text-sm mt-0.5 block">
                    {formatNeed(selectedRequest.Need)}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] text-[11px] block">Fecha de Registro:</span>
                  <span className="font-semibold text-[#062D3A] block mt-0.5">
                    {formatDate(selectedRequest.CreatedAt)}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg">
                  <span className="text-[#8E9FA2] text-[11px] block">Fecha Requerida por Cliente:</span>
                  <span className="font-semibold text-[#062D3A] block mt-0.5">
                    {extractRequestedDate(selectedRequest.Description) || formatDate(selectedRequest.CreatedAt)}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg sm:col-span-2">
                  <span className="text-[#8E9FA2] text-[11px] block">Ubicación del Servicio:</span>
                  <span className="font-bold text-[#062D3A] block mt-0.5">
                    📍 {selectedRequest.Location || 'No especificada'}
                  </span>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg sm:col-span-2">
                  <span className="text-[#8E9FA2] text-[11px] block">Descripción Técnica:</span>
                  <p className="font-medium text-[#334155] mt-1 whitespace-pre-line leading-relaxed">
                    {selectedRequest.Description || 'Sin descripción técnica adicional proporcionada.'}
                  </p>
                </div>
              </div>

              {/* Bitácora Técnica de Trabajo */}
              <WorkNotesSection
                notes={notes}
                isLoadingNotes={isLoadingNotes}
                canAddNote={true}
                onAddNote={handleAddNote}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

