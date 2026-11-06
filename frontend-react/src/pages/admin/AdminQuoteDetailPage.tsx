import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsApi } from '../../api/requests';
import { usersApi } from '../../api/users';
import { mockStore } from '../../data/mockDemoData';
import { isDemoMode } from '../../utils/demoMode';
import type { ServiceRequest, WorkNote, SystemUser, RequestStatus } from '../../types';
import { AdminSidebar } from './components/AdminSidebar';
import { QuoteDetailView } from './components/QuoteDetailView';

export const AdminQuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [operators, setOperators] = useState<SystemUser[]>([]);
  const [notes, setNotes] = useState<WorkNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Carga independiente de la cotización seleccionada por ID o Folio
  const loadQuoteData = useCallback(async () => {
    if (!id) {
      setError('Identificador de cotización no proporcionado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Cargar operadores para asignación
      const usersRes = await usersApi.getUsers().catch(() => []);
      setOperators(Array.isArray(usersRes) ? usersRes : []);

      // 2. Intentar resolver cotización
      let foundQuote: ServiceRequest | undefined;

      try {
        const allRequests = await requestsApi.getRequests();
        if (Array.isArray(allRequests)) {
          const clean = id.trim().toLowerCase();
          foundQuote = allRequests.find(
            (r) =>
              r.RequestId.toLowerCase() === clean ||
              r.Folio.toLowerCase() === clean ||
              r.Folio.toLowerCase().includes(clean)
          );
        }
      } catch (fetchErr: unknown) {
        // Fallback a mockStore ÚNICAMENTE en modo demostración
        if (isDemoMode()) {
          foundQuote = mockStore.getRequestById(id);
        } else {
          throw fetchErr; // Propagar error real en modo producción
        }
      }

      if (!foundQuote && isDemoMode()) {
        // Segundo intento en mockStore solo si está activo el modo demostración
        foundQuote = mockStore.getRequestById(id);
      }

      if (!foundQuote) {
        setError(`No se encontró el expediente correspondiente a la cotización "${id}".`);
        setRequest(null);
        return;
      }

      setRequest(foundQuote);

      // 3. Cargar notas de la cotización
      setIsLoadingNotes(true);
      try {
        const notesRes = await requestsApi.getNotes(foundQuote.RequestId);
        setNotes(Array.isArray(notesRes) ? notesRes : []);
      } catch {
        setNotes([]);
      } finally {
        setIsLoadingNotes(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar expediente de cotización';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuoteData();
  }, [loadQuoteData]);

  // Manejador de asignación de especialista
  const handleAssignOperator = async (operatorUserId: string) => {
    if (!request) return;
    setIsAssigning(true);
    try {
      await requestsApi.assignOperator(request.RequestId, operatorUserId);
      showNotification('✓ Operador asignado correctamente al expediente', 'success');
      await loadQuoteData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al asignar operador';
      showNotification(msg, 'error');
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  // Manejador de actualización de estado
  const handleUpdateStatus = async (newStatus: RequestStatus, comment?: string) => {
    if (!request) return;
    setIsUpdatingStatus(true);
    try {
      await requestsApi.updateStatus(request.RequestId, newStatus, comment);
      showNotification(`✓ Estado actualizado exitosamente`, 'success');
      await loadQuoteData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      showNotification(msg, 'error');
      throw err;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Manejador de registro de notas técnicas
  const handleAddNote = async (noteText: string) => {
    if (!request) return;
    await requestsApi.addNote(request.RequestId, noteText);
    const updated = await requestsApi.getNotes(request.RequestId);
    setNotes(Array.isArray(updated) ? updated : []);
    showNotification('✓ Nota técnica registrada en la bitácora', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col lg:flex-row text-[#062D3A]">
      {/* Barra Lateral Corporativa */}
      <AdminSidebar
        currentView="requests"
        onSelectView={(view) => {
          if (view === 'requests') {
            navigate('/admin');
          } else {
            navigate('/admin');
          }
        }}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Notificación Toast Flotante */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold transition-all border ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-red-600 text-white border-red-500'
            }`}
            role="status"
          >
            {notification.message}
          </div>
        )}

        {/* Contenido del Expediente */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto min-w-0">
          {isLoading ? (
            <div className="bg-white border border-[#E8ECEF] rounded-xl p-16 text-center text-xs text-[#8E9FA2]">
              <div className="inline-flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#7AC143]/20 border-t-[#7AC143] rounded-full animate-spin" />
                <span>Cargando expediente técnico de cotización...</span>
              </div>
            </div>
          ) : error || !request ? (
            <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-4">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-base font-bold text-red-800">
                {error || 'No fue posible cargar la cotización solicitada.'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-[#062D3A] text-white text-xs font-bold rounded-lg hover:bg-[#0C3E4F] transition-colors cursor-pointer"
              >
                ← Volver al listado de cotizaciones
              </button>
            </div>
          ) : (
            <QuoteDetailView
              request={request}
              operators={operators}
              notes={notes}
              isLoadingNotes={isLoadingNotes}
              isAssigning={isAssigning}
              isUpdatingStatus={isUpdatingStatus}
              onAssignOperator={handleAssignOperator}
              onUpdateStatus={handleUpdateStatus}
              onAddNote={handleAddNote}
              onRefresh={loadQuoteData}
              onBackToList={() => navigate('/admin')}
              onNotify={(msg, type) => showNotification(msg, type)}
              userName={user?.name || 'Ing. Mariana Valdés Admin'}
              userRole="Administrador"
              onLogout={handleLogout}
              onToggleMobileSidebar={() => setIsOpenMobile((prev) => !prev)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

