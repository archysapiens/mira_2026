import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsApi } from '../../api/requests';
import { usersApi } from '../../api/users';
import type { ServiceRequest, DashboardCounts, AdminView, SystemUser } from '../../types';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminSummaryView } from './components/AdminSummaryView';
import { AdminRequestsView } from './components/AdminRequestsView';
import { AdminNotesView } from './components/AdminNotesView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminProfileView } from './components/AdminProfileView';
import { AdminClientsView } from './components/AdminClientsView';
import { AdminReportsView } from './components/AdminReportsView';
import { Header } from '../../components/layout/Header';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [currentView, setCurrentView] = useState<AdminView>('summary');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>({ E: 0, A: 0, T: 0, C: 0 });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
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
      const msg = err instanceof Error ? err.message : 'Error al cargar datos administrativos';
      setError(msg);
      showNotification(`Error: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsersData = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const usersRes = await usersApi.getUsers();
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (err: unknown) {
      console.debug('Error al cargar usuarios:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUsersData();

    // Sincronización automática al recuperar el foco de la ventana (ej. tras editar en otra pestaña)
    const handleWindowFocus = () => {
      loadData();
      loadUsersData();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadData, loadUsersData]);

  const handleSelectRequestFromRecent = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentView('requests');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col lg:flex-row text-[#062D3A]">
      {/* Sidebar Admin */}
      <AdminSidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={user?.name || 'Diana Administradora'}
          userRole="ADMIN"
          title={
            currentView === 'summary'
              ? 'Consola de Administración'
              : currentView === 'requests'
              ? 'Cotizaciones'
              : currentView === 'clients'
              ? 'Cartera de Clientes'
              : currentView === 'reports'
              ? 'Reportes y Rendimiento'
              : currentView === 'notes'
              ? 'Bitácora Global'
              : currentView === 'users'
              ? 'Usuarios del Sistema'
              : 'Perfil Administrador'
          }
          subtitle={
            currentView === 'requests'
              ? 'Administración y seguimiento de solicitudes de cotización'
              : undefined
          }
          hideLogo={true}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsOpenMobile((prev) => !prev)}
        />

        {/* Notificación Toast */}
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

        {/* Alerta estática de error */}
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
            <AdminSummaryView
              userName={user?.name}
              counts={counts}
              requests={requests}
              onSelectRequest={handleSelectRequestFromRecent}
              onViewAllRequests={() => setCurrentView('requests')}
              onNavigateToUsers={() => setCurrentView('users')}
              onNavigateToNotes={() => setCurrentView('notes')}
              onNavigateToClients={() => setCurrentView('clients')}
              onNavigateToReports={() => setCurrentView('reports')}
              onNavigateToSettings={() => setCurrentView('profile')}
            />
          )}

          {currentView === 'requests' && (
            <AdminRequestsView
              requests={requests}
              selectedRequestId={selectedRequestId}
              onSelectRequest={(id) => setSelectedRequestId(id)}
              onRefresh={loadData}
              isLoading={isLoading}
              operators={users}
              onDataChanged={async () => {
                await loadData();
                await loadUsersData();
              }}
            />
          )}

          {currentView === 'clients' && (
            <AdminClientsView requests={requests} users={users} />
          )}

          {currentView === 'reports' && (
            <AdminReportsView counts={counts} requests={requests} />
          )}

          {currentView === 'notes' && (
            <AdminNotesView requests={requests} />
          )}

          {currentView === 'users' && (
            <AdminUsersView
              users={users}
              isLoading={isLoadingUsers}
              onRefresh={loadUsersData}
            />
          )}

          {currentView === 'profile' && (
            <AdminProfileView
              userName={user?.name}
              userEmail={user?.email}
            />
          )}
        </main>
      </div>
    </div>
  );
};
