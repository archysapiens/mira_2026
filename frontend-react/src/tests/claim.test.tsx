import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { requestsApi } from '../api/requests';
import type { AuthUser, ServiceRequest, DashboardResponse } from '../types';

describe('MIRA — Fase 9.2: Validación de Vinculación de Solicitudes (claimRequests)', () => {
  const verifiedUser: AuthUser = {
    id: 'usr-client-001',
    email: 'cliente.verificado@empresa.com',
    name: 'Lic. Roberto Morales',
    role: 'CLIENT',
    emailVerified: true,
  };

  const createFakeJwt = (sub: string = 'usr-client-001', role: string = 'CLIENT') => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub,
        email: 'cliente.verificado@empresa.com',
        name: 'Lic. Roberto Morales',
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    return `${header}.${payload}.fakesignature123`;
  };

  const mockRequests: ServiceRequest[] = [
    {
      RequestId: 'req-001',
      Folio: 'SOL-2026-001',
      ContactName: 'Lic. Roberto Morales',
      Company: 'MIRA Corp',
      Location: 'Oficina Central',
      Need: 'HOTEL',
      Urgency: 'Alta',
      Description: 'Revisión técnica de aire acondicionado',
      Status: 'E',
      CreatedAt: '2026-10-28T10:00:00Z',
    },
  ];

  const mockDashboard: DashboardResponse = {
    counts: { E: 1, A: 0, T: 0, C: 0 },
    labels: { E: 'Enviada', A: 'Atendida', T: 'Terminada', C: 'Cancelada' },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    localStorage.setItem('mira_token', createFakeJwt('usr-client-001'));
    localStorage.setItem('mira_user', JSON.stringify(verifiedUser));

    // Mocks seguros por defecto para evitar llamadas HTTP no controladas
    vi.spyOn(requestsApi, 'getDashboard').mockResolvedValue(mockDashboard);
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Vinculación exitosa en primer montaje
  it('1. Vinculación exitosa: ejecuta claimRequests y marca la sesión solo tras respuesta 200 OK', async () => {
    const claimSpy = vi.spyOn(requestsApi, 'claimRequests').mockResolvedValueOnce({
      claimedCount: 2,
      claimedFolios: ['SOL-2026-001', 'SOL-2026-002'],
      message: '2 solicitud(es) vinculada(s) con éxito.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });

    // La bandera en sessionStorage debe existir únicamente tras éxito
    expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBe('true');

    // Comprobar que se presentó notificación transitoria
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/se vincularon 2 solicitud\(es\)/i);
    });
  });

  // 2. Error de red y reintento
  it('2. Error de red y reintento: no bloquea la sesión y permite reintentar la vinculación', async () => {
    // Primer intento: error de conexión de red
    const claimSpy = vi.spyOn(requestsApi, 'claimRequests')
      .mockRejectedValueOnce(new Error('NetworkError: Failed to fetch'))
      .mockResolvedValueOnce({
        claimedCount: 1,
        claimedFolios: ['SOL-2026-003'],
        message: '1 solicitud vinculada con éxito.',
      });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Esperar primer intento fallido
    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });

    // La bandera NO debe haberse establecido en sessionStorage
    expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBeNull();

    // Navegar a Mis Solicitudes y pulsar "Actualizar" para reintentar
    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }));

    // Se debe haber reintentado la vinculación exitosamente
    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(2);
      expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBe('true');
    });
  });

  // 3. Error HTTP del servidor y reintento
  it('3. Error HTTP y reintento: error 500 no marca bandera y permite reintento posterior', async () => {
    const claimSpy = vi.spyOn(requestsApi, 'claimRequests')
      .mockRejectedValueOnce(new Error('Error HTTP 500: Database unavailable'))
      .mockResolvedValueOnce({
        claimedCount: 0,
        claimedFolios: [],
        message: '0 solicitudes vinculadas',
      });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });

    // La bandera en sessionStorage sigue sin establecerse
    expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBeNull();

    // Reintentar manualmente mediante el botón de actualizar
    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));
    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(2);
      expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBe('true');
    });
  });

  // 4. Correo no verificado no ejecuta claimRequests
  it('4. Correo no verificado: no dispara claimRequests bajo ninguna circunstancia', async () => {
    const unverifiedUser: AuthUser = {
      ...verifiedUser,
      emailVerified: false,
    };
    localStorage.setItem('mira_user', JSON.stringify(unverifiedUser));

    const claimSpy = vi.spyOn(requestsApi, 'claimRequests');

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Verifica tu correo/i)).toBeInTheDocument();
    });

    expect(claimSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBeNull();
  });

  // 5. Ejecución en React StrictMode no duplica peticiones simultáneas
  it('5. React StrictMode: ejecuta claimRequests una única vez sin llamadas duplicadas', async () => {
    const claimSpy = vi.spyOn(requestsApi, 'claimRequests').mockResolvedValue({
      claimedCount: 0,
      claimedFolios: [],
      message: '0 solicitud(es) vinculada(s) con éxito.',
    });

    render(
      <StrictMode>
        <MemoryRouter>
          <AuthProvider>
            <ClientDashboardPage />
          </AuthProvider>
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });

    // Confirmar que exactamente 1 llamada fue ejecutada en StrictMode
    expect(claimSpy).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBe('true');
  });

  // 6. Cierre de sesión limpia las llaves de sesión
  it('6. Cierre de sesión: limpia mira_token, mira_user y banderas mira_claimed_*', async () => {
    sessionStorage.setItem('mira_claimed_usr-client-001', 'true');

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('mira_token')).toBeNull();
      expect(localStorage.getItem('mira_user')).toBeNull();
      expect(sessionStorage.getItem('mira_claimed_usr-client-001')).toBeNull();
    });
  });

  // 7. Cambio de usuario maneja llaves de sesión aisladas por UserId
  it('7. Cambio de usuario: aísla las llaves por UserId y no bloquea al nuevo usuario', async () => {
    // Usuario A ya vinculado previamente en su sesión
    sessionStorage.setItem('mira_claimed_usr-client-AAA', 'true');

    // Ahora inicia sesión el Usuario B
    const userB: AuthUser = {
      id: 'usr-client-BBB',
      email: 'usuario.b@empresa.com',
      name: 'Ing. Bernardo Silva',
      role: 'CLIENT',
      emailVerified: true,
    };
    localStorage.setItem('mira_token', createFakeJwt('usr-client-BBB'));
    localStorage.setItem('mira_user', JSON.stringify(userB));

    const claimSpy = vi.spyOn(requestsApi, 'claimRequests').mockResolvedValueOnce({
      claimedCount: 1,
      claimedFolios: ['SOL-2026-999'],
      message: '1 solicitud vinculada con éxito.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });

    // La llave del usuario B debe haberse guardado independientemente
    expect(sessionStorage.getItem('mira_claimed_usr-client-BBB')).toBe('true');
  });

  // 8. Nuevas solicitudes pendientes después de una vinculación previa
  it('8. Nuevas solicitudes pendientes: permite revincular mediante actualización forzada', async () => {
    // Marcar que ya hubo una vinculación previa en esta sesión
    sessionStorage.setItem('mira_claimed_usr-client-001', 'true');

    const claimSpy = vi.spyOn(requestsApi, 'claimRequests').mockResolvedValueOnce({
      claimedCount: 3,
      claimedFolios: ['SOL-2026-010', 'SOL-2026-011', 'SOL-2026-012'],
      message: '3 solicitudes nuevas vinculadas con éxito.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // En el montaje inicial NO debe llamar a claim porque ya estaba marcado en la sesión
    expect(claimSpy).not.toHaveBeenCalled();

    // El usuario navega a Mis Solicitudes y presiona "Actualizar" (que ejecuta forceClaim)
    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }));

    // Debe haber ejecutado la vinculación forzada para capturar las nuevas solicitudes
    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalledTimes(1);
    });
  });
});
