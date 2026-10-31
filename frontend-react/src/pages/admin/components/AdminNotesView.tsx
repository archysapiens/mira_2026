import React, { useState, useEffect } from 'react';
import type { ServiceRequest, WorkNote } from '../../../types';
import { requestsApi } from '../../../api/requests';
import { formatNeed } from '../../../utils/formatters';
import { WorkNotesSection } from '../../../components/common/WorkNotesSection';

interface AdminNotesViewProps {
  requests: ServiceRequest[];
}

export const AdminNotesView: React.FC<AdminNotesViewProps> = ({ requests }) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (selectedRequestId) {
      setIsLoadingNotes(true);
      requestsApi
        .getNotes(selectedRequestId)
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
  }, [selectedRequestId]);

  const handleAddNote = async (noteText: string) => {
    if (!selectedRequestId) return;
    await requestsApi.addNote(selectedRequestId, noteText);
    const updated = await requestsApi.getNotes(selectedRequestId);
    setNotes(Array.isArray(updated) ? updated : []);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-[#062D3A] leading-tight">
          Bitácora Global de Operaciones
        </h2>
        <p className="text-xs sm:text-sm text-[#56696D] mt-1">
          Supervisa el historial completo de notas de campo y registra directivas técnicas para cualquier solicitud.
        </p>
      </div>

      <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-4">
        <label
          htmlFor="adminNotesSelect"
          className="text-xs font-bold text-[#062D3A] block"
        >
          Seleccionar Solicitud para Consultar o Agregar Avances:
        </label>
        <select
          id="adminNotesSelect"
          value={selectedRequestId}
          onChange={(e) => setSelectedRequestId(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] font-medium text-[#062D3A]"
          data-testid="admin-notes-request-select"
        >
          <option value="">-- Elige una solicitud de la plataforma --</option>
          {requests.map((r) => (
            <option key={r.RequestId} value={r.RequestId}>
              {r.Folio} · {r.Company || r.ContactName} ({formatNeed(r.Need)})
            </option>
          ))}
        </select>
      </div>

      {!selectedRequestId ? (
        <div className="p-12 text-center text-xs text-[#8E9FA2] italic bg-white border border-[#E8ECEF] rounded-xl">
          Selecciona una solicitud en el menú superior para desplegar su bitácora técnica.
        </div>
      ) : (
        <WorkNotesSection
          notes={notes}
          isLoadingNotes={isLoadingNotes}
          canAddNote={true}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
};

