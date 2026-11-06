import React, { useState } from 'react';
import type { RequestStatus } from '../../types';
import { STATUS_CONFIG } from '../../utils/formatters';

interface StatusUpdateSelectorProps {
  currentStatus: RequestStatus;
  isUpdating?: boolean;
  onUpdateStatus: (newStatus: RequestStatus, comment?: string) => Promise<void>;
}

export const StatusUpdateSelector: React.FC<StatusUpdateSelectorProps> = ({
  currentStatus,
  isUpdating = false,
  onUpdateStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(currentStatus);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableStatuses: RequestStatus[] = ['E', 'A', 'T', 'C'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === currentStatus) {
      setErrorMsg('El estado seleccionado es idéntico al actual.');
      return;
    }
    setErrorMsg(null);
    try {
      await onUpdateStatus(selectedStatus, comment.trim() || undefined);
      setComment('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      setErrorMsg(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-[#F8FAFC] border border-[#E8ECEF] rounded-xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="statusSelect"
          className="text-xs font-bold text-[#062D3A] flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>Actualizar Estado del Servicio</span>
        </label>
        <span className="text-[11px] text-[#56696D]">
          Actual: <strong>{STATUS_CONFIG[currentStatus]?.label || currentStatus}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
        <div className="min-w-0">
          <label htmlFor="statusSelect" className="sr-only">Nuevo estado</label>
          <select
            id="statusSelect"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as RequestStatus);
              setErrorMsg(null);
            }}
            className="w-full min-w-0 px-3 py-1.5 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] font-medium text-[#062D3A]"
          >
            {availableStatuses.map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st]?.label} ({st})
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="statusComment" className="sr-only">Comentario opcional</label>
          <input
            id="statusComment"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Motivo o comentario del cambio (opcional)..."
            className="w-full min-w-0 px-3 py-1.5 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isUpdating || selectedStatus === currentStatus}
          className="px-4 py-2 bg-[#062D3A] hover:bg-[#0C3E4F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? 'Actualizando...' : 'Confirmar Cambio de Estado'}
        </button>
      </div>
    </form>
  );
};

