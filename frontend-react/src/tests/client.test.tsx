import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { requestsApi } from '../api/requests';
import { authApi } from '../api/auth';
import type { ServiceRequest, AuthUser } from '../types';

const createMockToken = (payload: { id: number; email: string; name: string; role: string; exp: number }) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock_signature`;
};

const mockRequests: ServiceRequest[] = [
  {
    RequestId: 'req-001',
    Folio: 'SOL-2026-001',
    ContactName: 'Cliente Prueba',
    Email: 'cliente@mira.com',
    Company: 'Empresa SA',
    Location: 'Ciudad de México',
    Need: 'HOTEL',
    Urgency: 'Alta',
    Description: 'Revisión urgente de sistema eléctrico. Fecha requerida: 2026-11-01',
    Status: 'E',
    CreatedAt: '2026-10-15T10:00:00Z',
    OperatorName: null,
  },
  {
    RequestId: 'req-002',
    Folio: 'SOL-2026-002',
    ContactName: 'Cliente Prueba',
    Email: 'cliente@mira.com',
    Company: 'Empresa SA',
    Location: 'Guadalajara',
    Need: 'Fumigación preventiva',
    Urgency: 'Normal',
    Description: 'Fumigación de almacén y oficinas centrales.',
    Status: 'A',
    CreatedAt: '2026-10-16T14:30:00Z',
    OperatorName: 'Carlos Especialista',
  },
  {
    RequestId: 'req-003',
    Folio: 'SOL-2026-003',
    ContactName: 'Cliente Prueba',
    Email: 'cliente@mira.com',
    Company: 'Empresa SA',
    Location: 'Monterrey',
    Need: 'Pintura exterior',
    Urgency: 'Baja',
    Description: 'Pintura y acabado en fachada principal.',
    Status: 'T',
    CreatedAt: '2026-10-17T09:00:00Z',
    OperatorName: 'Ana Pintora',
  },
  {
    RequestId: 'req-004',
    Folio: 'SOL-2026-004',
    ContactName: 'Cliente Prueba',
    Email: 'cliente@mira.com',
    Company: null,
    Location: 'Puebla',
    Need: 'Cancelación solicitada',
    Urgency: 'Normal',
    Description: 'Servicio duplicado por error.',
    Status: 'C',
    CreatedAt: '2026-10-18T16:00:00Z',
  },
];

const mockDashboardResponse = {
  counts: { E: 1, A: 1, T: 1, C: 1 },
  labels: { E: 'Enviada', A: 'Atendida', T: 'Terminada', C: 'Cancelada' },
};

describe('MIRA - Pruebas del Portal del Cliente (Fase 9)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Sesión por defecto como CLIENT verificado
    const token = createMockToken({
      id: 1,
      email: 'cliente@mira.com',
      name: 'Elizabeth Morales',
      role: 'CLIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const user: AuthUser = {
      id: 1,
      email: 'cliente@mira.com',
      name: 'Elizabeth Morales',
      role: 'CLIENT',
      emailVerified: true,
    };
    localStorage.setItem('mira_token', token);
    localStorage.setItem('mira_user', JSON.stringify(user));

    vi.spyOn(requestsApi, 'getDashboard').mockResolvedValue(mockDashboardResponse);
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);
    vi.spyOn(requestsApi, 'getNotes').mockResolvedValue([]);
    vi.spyOn(requestsApi, 'claimRequests').mockResolvedValue({
      claimedCount: 0,
      claimedFolios: [],
      message: '0 solicitudes vinculadas.',
    });
  });

  // 1. Renderizado del portal
  it('1. Renderizado del portal muestra cabecera, saludo y métricas principales', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Portal Cliente')).toBeInTheDocument();
    expect(screen.getAllByText(/Elizabeth/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByTestId('metric-total')).toHaveTextContent('4');
      expect(screen.getByTestId('metric-sent')).toHaveTextContent('1');
      expect(screen.getByTestId('metric-attended')).toHaveTextContent('1');
      expect(screen.getByTestId('metric-completed')).toHaveTextContent('1');
    });
  });

  // 2. Restricción de acceso por rol
  it('2. Restricción de acceso por rol bloquea usuarios con rol OPERATOR', async () => {
    const operatorToken = createMockToken({
      id: 2,
      email: 'operador@mira.com',
      name: 'Operador MIRA',
      role: 'OPERATOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const operatorUser: AuthUser = {
      id: 2,
      email: 'operador@mira.com',
      name: 'Operador MIRA',
      role: 'OPERATOR',
    };
    localStorage.setItem('mira_token', operatorToken);
    localStorage.setItem('mira_user', JSON.stringify(operatorUser));

    render(
      <MemoryRouter initialEntries={['/cliente']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Pantalla Login</div>} />
            <Route path="/operador" element={<div>Panel Operador Redirigido</div>} />
            <Route
              path="/cliente"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel Operador Redirigido')).toBeInTheDocument();
      expect(screen.queryByText('Portal Cliente')).not.toBeInTheDocument();
    });
  });

  // 3. Listado de solicitudes
  it('3. Listado de solicitudes muestra la lista completa en la vista de solicitudes', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const navBtn = screen.getByRole('button', { name: /^mis solicitudes$/i });
    fireEvent.click(navBtn);

    await waitFor(() => {
      expect(screen.getByText(/Consulta el estado técnico, avance y asignación/i)).toBeInTheDocument();
      expect(screen.getAllByText('Fumigación preventiva').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pintura exterior').length).toBeGreaterThan(0);
    });
  });

  // 4. Visualización de folios
  it('4. Visualización de folios presenta los códigos oficiales SOL-2026-001 a SOL-2026-004', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const navBtn = screen.getByRole('button', { name: /^mis solicitudes$/i });
    fireEvent.click(navBtn);

    await waitFor(() => {
      expect(screen.getAllByText('SOL-2026-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SOL-2026-002').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SOL-2026-003').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SOL-2026-004').length).toBeGreaterThan(0);
    });
  });

  // 5. Estados de solicitudes
  it('5. Estados de solicitudes muestra etiquetas legibles para E, A, T y C', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const navBtn = screen.getByRole('button', { name: /^mis solicitudes$/i });
    fireEvent.click(navBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Enviada').length).toBeGreaterThan(0);
      expect(screen.getAllByText('En atención').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Terminada').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Cancelada').length).toBeGreaterThan(0);
    });
  });

  // 6. Búsqueda y filtros
  it('6. Búsqueda y filtros filtra correctamente por texto y estado', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('request-search-input')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('request-search-input');
    fireEvent.change(searchInput, { target: { value: 'Fumigación' } });

    await waitFor(() => {
      expect(screen.getByText('Fumigación preventiva')).toBeInTheDocument();
      expect(screen.queryByText('Pintura exterior')).not.toBeInTheDocument();
    });

    // Limpiar búsqueda y filtrar por estado T (Terminadas)
    fireEvent.change(searchInput, { target: { value: '' } });
    const selectFilter = screen.getByTestId('status-filter-select');
    fireEvent.change(selectFilter, { target: { value: 'T' } });

    await waitFor(() => {
      expect(screen.getByText('Pintura exterior')).toBeInTheDocument();
      expect(screen.queryByText('Fumigación preventiva')).not.toBeInTheDocument();
    });
  });

  // 7. Apertura del detalle
  it('7. Apertura del detalle muestra información técnica y responsable asignado', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('request-item-SOL-2026-002')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('request-item-SOL-2026-002'));

    await waitFor(() => {
      expect(screen.getByTestId('detail-folio')).toHaveTextContent('SOL-2026-002');
      expect(screen.getByText(/Carlos Especialista/i)).toBeInTheDocument();
      expect(screen.getByText(/Fumigación de almacén y oficinas centrales/i)).toBeInTheDocument();
    });
  });

  // 8. Estado sin solicitudes
  it('8. Estado sin solicitudes muestra mensaje descriptivo en tabla y lista', async () => {
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValueOnce([]);
    vi.spyOn(requestsApi, 'getDashboard').mockResolvedValueOnce({ counts: {} });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Aún no tienes solicitudes registradas/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));

    await waitFor(() => {
      expect(screen.getByText(/No se encontraron solicitudes con los filtros aplicados/i)).toBeInTheDocument();
    });
  });

  // 9. Errores de API simulados
  it('9. Errores de API simulados muestra alerta de error sin interrumpir la app', async () => {
    vi.spyOn(requestsApi, 'getRequests').mockRejectedValueOnce(
      new Error('Error de conexión con el servicio de solicitudes.')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/error de conexión con el servicio/i);
    });
  });

  // 10. Estado de carga
  it('10. Estado de carga muestra indicador mientras se obtienen solicitudes', async () => {
    // Retrasar resolución de solicitudes
    let resolveFn: (val: ServiceRequest[]) => void = () => {};
    const pendingPromise = new Promise<ServiceRequest[]>((resolve) => {
      resolveFn = resolve;
    });
    vi.spyOn(requestsApi, 'getRequests').mockReturnValueOnce(pendingPromise);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^mis solicitudes$/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/cargando solicitudes/i);

    resolveFn(mockRequests);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  // 11. Verificación de correo
  it('11. Verificación de correo muestra advertencia si no está verificado y abre modal', async () => {
    const unverifiedUser: AuthUser = {
      id: 1,
      email: 'unverified@mira.com',
      name: 'Cliente Pendiente',
      role: 'CLIENT',
      emailVerified: false,
    };
    localStorage.setItem('mira_user', JSON.stringify(unverifiedUser));

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Verifica tu correo/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviar código OTP/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /enviar código OTP/i }));

    await waitFor(() => {
      expect(screen.getByText(/Verificación de Correo Electrónico/i)).toBeInTheDocument();
    });
  });

  // 12. Flujo de vinculación simulado
  it('12. Flujo de vinculación simulado llama a claimRequests tras verificar OTP', async () => {
    const unverifiedUser: AuthUser = {
      id: 1,
      email: 'unverified@mira.com',
      name: 'Cliente Pendiente',
      role: 'CLIENT',
      emailVerified: false,
    };
    localStorage.setItem('mira_user', JSON.stringify(unverifiedUser));

    vi.spyOn(authApi, 'requestEmailVerification').mockResolvedValueOnce({
      sent: true,
      expiresInMinutes: 15,
      message: 'Código enviado',
    });
    vi.spyOn(authApi, 'verifyEmail').mockResolvedValueOnce({
      verified: true,
      emailVerified: true,
      claimedCount: 2,
      claimedFolios: ['SOL-2026-001', 'SOL-2026-002'],
      message: 'Correo verificado y solicitudes vinculadas.',
    });
    const claimSpy = vi.spyOn(requestsApi, 'claimRequests').mockResolvedValueOnce({
      claimedCount: 2,
      claimedFolios: ['SOL-2026-001', 'SOL-2026-002'],
      message: '2 solicitudes vinculadas con éxito.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Abrir modal
    fireEvent.click(screen.getByRole('button', { name: /enviar código OTP/i }));

    // Solicitar código
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar código por correo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar código por correo/i }));

    // Ingresar código y validar
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar código/i }));

    // Confirmar en modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /¡Correo verificado con éxito!/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /continuar al portal/i }));

    await waitFor(() => {
      expect(claimSpy).toHaveBeenCalled();
      expect(screen.getByText(/¡Se vincularon 2 solicitud\(es\) anteriores!/i)).toBeInTheDocument();
    });
  });

  // 13. Diseño y navegación responsiva
  it('13. Navegación responsiva permite abrir y cerrar el menú móvil', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Esperar a que el componente cargue los datos iniciales
    await waitFor(() => {
      expect(screen.getByTestId('metric-total')).toHaveTextContent('4');
    });

    const toggleBtn = screen.getByLabelText(/abrir menú de navegación/i);
    fireEvent.click(toggleBtn);

    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop);
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });

  // 14. Cierre de sesión
  it('14. Cierre de sesión limpia los tokens en localStorage y actualiza la sesión', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Esperar a que el componente cargue los datos iniciales
    await waitFor(() => {
      expect(screen.getByTestId('metric-total')).toHaveTextContent('4');
    });

    const logoutBtn = screen.getByTitle(/cerrar sesión/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('mira_token')).toBeNull();
      expect(localStorage.getItem('mira_user')).toBeNull();
    });
  });
});
