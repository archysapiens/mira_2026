import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsApi } from '../../api/requests';
import type { ServiceRequest, DashboardCounts, ClientView } from '../../types';
import { ClientSidebar } from './components/ClientSidebar';
import { ClientHeader } from './components/ClientHeader';
import { SummaryView } from './components/SummaryView';
import { RequestsView } from './components/RequestsView';
import { DocumentsView } from './components/DocumentsView';
import { ProfileView } from './components/ProfileView';
import { VerifyOtpModal } from '../../components/common/VerifyOtpModal';

export const ClientDashboardPage: React.FC = () => {
  const { user, logout, isEmailVerified, updateEmailVerifiedStatus } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [currentView, setCurrentView] = useState<ClientView>('summary');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>({ E: 0, A: 0, T: 0, C: 0 });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hasClaimedRef = useRef(false);
  const isClaimingRef = useRef(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Cargar métricas y solicitudes
  const loadData = useCallback(async (options: { skipClaim?: boolean; forceClaim?: boolean } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // Reclamar solicitudes huérfanas solo si el cliente está verificado y no se ha reclamado en la sesión
      const sessionKey = user?.id ? `mira_claimed_${user.id}` : null;
      const isAlreadyClaimed = sessionKey && typeof window !== 'undefined' && window.sessionStorage
        ? sessionStorage.getItem(sessionKey) === 'true'
        : false;

      const shouldClaim = isEmailVerified && (options.forceClaim || (!hasClaimedRef.current && !isAlreadyClaimed && !options.skipClaim));

      if (shouldClaim && !isClaimingRef.current) {
        isClaimingRef.current = true;
        try {
          const claimRes = await requestsApi.claimRequests();
          // Solo tras respuesta exitosa se marca la bandera de completado
          hasClaimedRef.current = true;
          if (sessionKey && typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem(sessionKey, 'true');
          }
          if (claimRes && claimRes.claimedCount > 0) {
            showNotification(`Se vincularon ${claimRes.claimedCount} solicitud(es) anteriores a tu cuenta.`, 'success');
          }
        } catch (claimErr) {
          // En caso de error de red o HTTP, NO se marca hasClaimedRef ni sessionStorage,
          // permitiendo reintentar la operación en el siguiente ciclo o al presionar Reintentar.
          console.debug('ClaimRequests falló (se permitirá reintento):', claimErr);
        } finally {
          isClaimingRef.current = false;
        }
      }

      const [dashRes, reqsRes] = await Promise.all([
        requestsApi.getDashboard().catch(() => ({ counts: { E: 0, A: 0, T: 0, C: 0 } })),
        requestsApi.getRequests(),
      ]);

      const rawCounts: Partial<DashboardCounts> = dashRes.counts || {};
      const newCounts: DashboardCounts = {
        E: Number(rawCounts.E || 0),
        A: Number(rawCounts.A || 0),
        T: Number(rawCounts.T || 0),
        C: Number(rawCounts.C || 0),
      };
      setCounts(newCounts);

      const reqList = Array.isArray(reqsRes) ? reqsRes : [];
      setRequests(reqList);

      // Si no hay seleccionada o la actual no existe en la lista, seleccionar la primera
      setSelectedRequestId((prev) => {
        if (prev && reqList.some((r) => r.RequestId === prev)) {
          return prev;
        }
        return reqList.length > 0 ? reqList[0].RequestId : null;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos del portal';
      setError(msg);
      showNotification(`Error: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isEmailVerified]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selección de solicitud desde tabla reciente o lista
  const handleSelectRequestFromRecent = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentView('requests');
  };

  // Verificación OTP exitosa
  const handleOtpVerified = async () => {
    updateEmailVerifiedStatus(true);

    let claimedMessage = '';
    try {
      const claimRes = await requestsApi.claimRequests();
      // Solo tras respuesta exitosa se marca la bandera de completado
      hasClaimedRef.current = true;
      const sessionKey = user?.id ? `mira_claimed_${user.id}` : null;
      if (sessionKey && typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(sessionKey, 'true');
      }
      if (claimRes && claimRes.claimedCount > 0) {
        claimedMessage = ` ¡Se vincularon ${claimRes.claimedCount} solicitud(es) anteriores!`;
      }
    } catch (claimErr) {
      console.debug('Claim check post OTP falló (se permitirá reintento):', claimErr);
    }

    showNotification(`¡Correo verificado con éxito!${claimedMessage}`, 'success');
    await loadData({ skipClaim: true });
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col lg:flex-row text-[#062D3A]">
      {/* Sidebar Lateral */}
      <ClientSidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Contenedor Principal (Header + Vistas) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecera Superior */}
        <ClientHeader
          userName={user?.name || 'Cliente'}
          userRole="Cliente"
          onToggleMobileSidebar={() => setIsOpenMobile((prev) => !prev)}
          onNotificationsClick={() => setCurrentView('requests')}
          onLogout={handleLogout}
        />

        {/* Notificación Flotante */}
        {notification && (
          <div
            className={`mx-4 md:mx-8 mt-4 p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm transition-all ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
            role="status"
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs opacity-75 hover:opacity-100 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            className="mx-4 md:mx-8 mt-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-semibold"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Contenido Dinámico según la Vista */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'summary' && (
            <SummaryView
              userName={user?.name}
              isEmailVerified={isEmailVerified}
              counts={counts}
              recentRequests={requests}
              onOpenOtpModal={() => setIsOtpModalOpen(true)}
              onViewAllRequests={() => setCurrentView('requests')}
              onSelectRequest={handleSelectRequestFromRecent}
              onViewProfile={() => setCurrentView('profile')}
            />
          )}

          {currentView === 'requests' && (
            <RequestsView
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
              onRefresh={() => loadData({ forceClaim: true })}
              isLoading={isLoading}
            />
          )}

          {currentView === 'documents' && (
            <DocumentsView onGoToRequests={() => setCurrentView('requests')} />
          )}

          {currentView === 'profile' && (
            <ProfileView
              userName={user?.name}
              userEmail={user?.email}
              isEmailVerified={isEmailVerified}
              onOpenOtpModal={() => setIsOtpModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modal OTP de Verificación */}
      <VerifyOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialEmail={user?.email || ''}
        onVerified={handleOtpVerified}
      />
    </div>
  );
};
