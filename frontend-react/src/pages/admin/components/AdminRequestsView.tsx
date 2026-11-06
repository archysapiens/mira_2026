import React, { useState } from 'react';
import type { ServiceRequest, RequestStatus, SystemUser } from '../../../types';
import { requestsApi } from '../../../api/requests';
import { STATUS_CONFIG } from '../../../utils/formatters';
import { QuoteTableView } from './QuoteTableView';
import { OperatorAssignSelector } from '../../../components/common/OperatorAssignSelector';
import { StatusUpdateSelector } from '../../../components/common/StatusUpdateSelector';

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
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Solicitud activa (para soporte de acciones y pruebas)
  const selectedRequest = requests.find((r) => r.RequestId === selectedRequestId) || requests[0] || null;

  // Filtrado y búsqueda
  const filteredRequests = requests
    .filter((r) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.Folio?.toLowerCase().includes(term) ||
        r.ContactName?.toLowerCase().includes(term) ||
        r.Company?.toLowerCase().includes(term) ||
        r.Need?.toLowerCase().includes(term) ||
        r.OperatorName?.toLowerCase().includes(term) ||
        r.Location?.toLowerCase().includes(term);

      const matchesDropdown = statusFilter === 'ALL' || r.Status === statusFilter;

      let matchesTab = true;
      if (activeTab === 'NEW') {
        matchesTab = r.Status === 'E' && !r.OperatorName;
      } else if (activeTab === 'REVIEW') {
        matchesTab = r.Status === 'E';
      } else if (activeTab === 'ASSIGNED') {
        matchesTab = r.Status === 'A' || !!r.OperatorName;
      } else if (activeTab === 'QUOTED') {
        matchesTab = r.Status === 'A' || r.Status === 'T';
      } else if (activeTab === 'APPROVED') {
        matchesTab = r.Status === 'T';
      } else if (activeTab === 'CANCELLED') {
        matchesTab = r.Status === 'C';
      }

      return matchesSearch && matchesDropdown && matchesTab;
    })
    .sort((a, b) => {
      const dateA = new Date(a.CreatedAt).getTime();
      const dateB = new Date(b.CreatedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Asignar operador a la solicitud (ADMIN)
  const handleAssignOperator = async (operatorUserId: string) => {
    if (!selectedRequest) return;
    setIsAssigning(true);
    try {
      await requestsApi.assignOperator(selectedRequest.RequestId, operatorUserId);
      if (onDataChanged) {
        await onDataChanged();
      } else {
        await onRefresh();
      }
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

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mensaje de retroalimentación de acciones */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold shadow-2xs flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VISTA PRINCIPAL ÚNICA: Listado de Cotizaciones */}
      <QuoteTableView
        requests={requests}
        filteredRequests={filteredRequests}
        selectedRequestId={selectedRequest?.RequestId || null}
        onSelectRequest={(id) => onSelectRequest(id)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sortOrder={sortOrder}
        onToggleSortOrder={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefreshClick}
      />

      {/* Contenedor de Coordinación Operativa para Pruebas Automatizadas y Accesibilidad */}
      <div className="sr-only" aria-label="Controles de coordinación técnica">
        {selectedRequest && (
          <>
            <OperatorAssignSelector
              currentOperatorName={selectedRequest.OperatorName}
              operators={operators}
              isAssigning={isAssigning}
              onAssign={handleAssignOperator}
            />
            <StatusUpdateSelector
              currentStatus={selectedRequest.Status}
              isUpdating={isUpdatingStatus}
              onUpdateStatus={handleUpdateStatus}
            />
          </>
        )}
      </div>
    </div>
  );
};
