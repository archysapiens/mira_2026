import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsApi } from '../../api/requests';
import type { ServiceRequest, DashboardCounts, OperatorView } from '../../types';
import { OperatorSidebar } from './components/OperatorSidebar';
import { OperatorSummaryView } from './components/OperatorSummaryView';
import { OperatorRequestsView } from './components/OperatorRequestsView';
import { OperatorProfileView } from './components/OperatorProfileView';
import { Header } from '../../components/layout/Header';

export const OperatorDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [currentView, setCurrentView] = useState<OperatorView>('summary');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>({ E: 0, A: 0, T: 0, C: 0 });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
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

      setSelectedRequestId((prev) => {
        if (prev && reqList.some((r) => r.RequestId === prev)) {
          return prev;
        }
        return reqList.length > 0 ? reqList[0].RequestId : null;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos operativos';
      setError(msg);
      showNotification(`Error: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRequestFromRecent = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentView('requests');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col lg:flex-row text-[#062D3A]">
      {/* Sidebar Operador */}
      <OperatorSidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior Reutilizado */}
        <Header
          userName={user?.name || 'Operador Especialista'}
          userRole="OPERATOR"
          title={
            currentView === 'summary'
              ? 'Panel Operativo'
              : currentView === 'requests'
              ? 'Servicios Asignados'
              : 'Perfil Técnico'
          }
          onLogout={handleLogout}
          onToggleSidebar={() => setIsOpenMobile((prev) => !prev)}
        />

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

        {/* Alerta estática de error si falla la carga */}
        {error && (
          <div className="m-4 md:m-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between" role="alert">
            <span>{error}</span>
            <button
              onClick={() => loadData()}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded font-bold cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido Dinámico de Vistas */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'summary' && (
            <OperatorSummaryView
              userName={user?.name}
              counts={counts}
              requests={requests}
              onSelectRequest={handleSelectRequestFromRecent}
              onViewAllRequests={() => setCurrentView('requests')}
            />
          )}

          {currentView === 'requests' && (
            <OperatorRequestsView
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
              onRefresh={loadData}
              isLoading={isLoading}
              onStatusUpdated={loadData}
            />
          )}

          {currentView === 'profile' && (
            <OperatorProfileView
              userName={user?.name}
              userEmail={user?.email}
            />
          )}
        </main>
      </div>
    </div>
  );
};
