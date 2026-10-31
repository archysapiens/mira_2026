import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { requestsApi } from '../api/requests';
import { usersApi } from '../api/users';
import type { ServiceRequest, AuthUser, SystemUser, WorkNote } from '../types';

const createMockToken = (payload: { id: string | number; email: string; name: string; role: string; exp: number }) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock_signature`;
};

const mockAdminUser: AuthUser = {
  id: 1,
  email: 'admin.general@mira.com',
  name: 'Diana Administradora',
  role: 'ADMIN',
  emailVerified: true,
};

const mockSystemUsers: SystemUser[] = [
  {
    UserId: 'usr-001',
    Email: 'admin.general@mira.com',
    FullName: 'Diana Administradora',
    RoleCode: 'ADMIN',
    IsActive: true,
  },
  {
    UserId: 'usr-002',
    Email: 'carlos.operador@mira.com',
    FullName: 'Carlos Mendoza',
    RoleCode: 'OPERATOR',
    IsActive: true,
  },
  {
    UserId: 'usr-003',
    Email: 'cliente.corporativo@acero.com',
    FullName: 'Roberto González',
    RoleCode: 'CLIENT',
    IsActive: true,
  },
  {
    UserId: 'usr-004',
    Email: 'inactivo.operador@mira.com',
    FullName: 'Pedro Inactivo',
    RoleCode: 'OPERATOR',
    IsActive: false,
  },
];

const mockRequests: ServiceRequest[] = [
  {
    RequestId: 'req-adm-1',
    Folio: 'SOL-2026-ADM1',
    ContactName: 'Roberto González',
    Email: 'cliente.corporativo@acero.com',
    Company: 'Acero Regio SA',
    Location: 'Monterrey, NL',
    Need: 'ELECTRICIDAD',
    Urgency: 'Alta',
    Description: 'Mantenimiento urgente de transformador de 500kVA.',
    Status: 'E',
    CreatedAt: '2026-10-25T09:00:00Z',
    OperatorName: null,
  },
  {
    RequestId: 'req-adm-2',
    Folio: 'SOL-2026-ADM2',
    ContactName: 'Laura Méndez',
    Email: 'laura@hotelreal.com',
    Company: 'Hotel Real del Mar',
    Location: 'Cancún, QROO',
    Need: 'CLIMATIZACION',
    Urgency: 'Media',
    Description: 'Revisión preventiva de chillers en área de convenciones.',
    Status: 'A',
    CreatedAt: '2026-10-26T11:30:00Z',
    OperatorName: 'Carlos Mendoza',
  },
  {
    RequestId: 'req-adm-3',
    Folio: 'SOL-2026-ADM3',
    ContactName: 'Andrés Castro',
    Email: 'andres@logistica.com',
    Company: 'Logística Total',
    Location: 'Querétaro, QRO',
    Need: 'FUMIGACION',
    Urgency: 'Baja',
    Description: 'Sanitización y control de plagas en CEDIS.',
    Status: 'T',
    CreatedAt: '2026-10-27T16:00:00Z',
    OperatorName: 'Carlos Mendoza',
  },
];

const mockNotes: WorkNote[] = [
  {
    WorkNoteId: 'note-adm-1',
    Author: 'Diana Administradora',
    Note: 'Se recibió solicitud y se programó visita técnica preliminar.',
    CreatedAt: '2026-10-25T10:00:00Z',
  },
];

const mockDashboardResponse = {
  counts: { E: 1, A: 1, T: 1, C: 0 },
  labels: { E: 'Enviada', A: 'Atendida', T: 'Terminada', C: 'Cancelada' },
};

describe('MIRA - Pruebas del Panel de Administrador (Fase 10)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    const token = createMockToken({
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
      role: mockAdminUser.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    localStorage.setItem('mira_token', token);
    localStorage.setItem('mira_user', JSON.stringify(mockAdminUser));

    vi.spyOn(requestsApi, 'getDashboard').mockResolvedValue(mockDashboardResponse);
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);
    vi.spyOn(requestsApi, 'getNotes').mockResolvedValue(mockNotes);
    vi.spyOn(usersApi, 'getUsers').mockResolvedValue(mockSystemUsers);
  });

  // 1. Acceso autorizado para rol ADMIN
  it('1. Permite el acceso autorizado a usuarios con rol ADMIN y muestra la consola central', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Panel de Control, Diana/i })).toBeInTheDocument();
      expect(screen.getByText(/Supervisión Central de Operaciones/i)).toBeInTheDocument();
    });
  });

  // 2. Rechazo de roles no autorizados (CLIENT y OPERATOR son redirigidos a sus respectivos paneles)
  it('2. Deniega el acceso al panel admin a roles CLIENT y OPERATOR redirigiéndolos correctamente', async () => {
    // Probar con rol OPERATOR
    const opUser: AuthUser = {
      id: 2,
      email: 'operador@mira.com',
      name: 'Operador User',
      role: 'OPERATOR',
      emailVerified: true,
    };
    const opToken = createMockToken({
      id: 2,
      email: 'operador@mira.com',
      name: 'Operador User',
      role: 'OPERATOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem('mira_token', opToken);
    localStorage.setItem('mira_user', JSON.stringify(opUser));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/operador" element={<div>Redirigido a Panel Operador</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Redirigido a Panel Operador')).toBeInTheDocument();
      expect(screen.queryByText(/Supervisión Central de Operaciones/i)).not.toBeInTheDocument();
    });
  });

  // 3. Métricas cuantitativas globales de plataforma
  it('3. Muestra las métricas cuantitativas consolidadas a nivel plataforma', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Plataforma')).toBeInTheDocument();
      expect(screen.getByText('Enviadas / Recibidas')).toBeInTheDocument();
      expect(screen.getByText('En Atención / Proceso')).toBeInTheDocument();
      expect(screen.getByText('Concluidas con Éxito')).toBeInTheDocument();
    });
  });

  // 4. Listado general de solicitudes
  it('4. Permite navegar a la gestión de solicitudes y muestra todas las solicitudes', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Panel de Control, Diana/i })).toBeInTheDocument();
    });

    // Cambiar a vista 'requests' desde sidebar
    const requestsNavBtn = screen.getByRole('button', { name: /gestión de solicitudes/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getAllByText('SOL-2026-ADM1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('SOL-2026-ADM2')).toBeInTheDocument();
      expect(screen.getByText('SOL-2026-ADM3')).toBeInTheDocument();
    });
  });

  // 5. Asignación de operadores (assignOperator)
  it('5. Permite al administrador asignar un especialista operativo a una solicitud sin asignar', async () => {
    const assignSpy = vi.spyOn(requestsApi, 'assignOperator').mockResolvedValue({
      updated: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /gestión de solicitudes/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/asignación de especialista/i)).toBeInTheDocument();
    });

    // Seleccionar operador en el selector (usr-002 es Carlos Mendoza)
    const select = screen.getByLabelText(/asignación de especialista/i);
    fireEvent.change(select, { target: { value: 'usr-002' } });

    const assignBtn = screen.getByRole('button', { name: /asignar especialista/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith('req-adm-1', 'usr-002');
      expect(screen.getByText(/✓ Operador asignado correctamente/i)).toBeInTheDocument();
    });
  });

  // 6. Consulta de usuarios (usersApi.getUsers)
  it('6. Muestra la lista de usuarios del sistema con sus roles y estados', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Navegar a Usuarios desde el sidebar
    const usersNavBtn = screen.getByRole('button', { name: /usuarios del sistema/i });
    fireEvent.click(usersNavBtn);

    await waitFor(() => {
      expect(usersApi.getUsers).toHaveBeenCalled();
      expect(screen.getAllByText('Diana Administradora').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
      expect(screen.getByText('Roberto González')).toBeInTheDocument();
      expect(screen.getByText('Pedro Inactivo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  // 7. Filtros y búsqueda de solicitudes y usuarios
  it('7. Permite realizar búsquedas y filtros en la gestión de solicitudes y de usuarios', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // 1) Probar búsqueda en solicitudes
    const requestsNavBtn = screen.getByRole('button', { name: /gestión de solicitudes/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByTestId('admin-search-input')).toBeInTheDocument();
    });

    const searchReqInput = screen.getByTestId('admin-search-input');
    fireEvent.change(searchReqInput, { target: { value: 'Cancún' } });

    await waitFor(() => {
      expect(screen.getByText(/1 solicitud en plataforma/i)).toBeInTheDocument();
      expect(screen.getAllByText('SOL-2026-ADM2').length).toBeGreaterThanOrEqual(1);
    });

    // 2) Probar búsqueda en usuarios
    const usersNavBtn = screen.getByRole('button', { name: /usuarios del sistema/i });
    fireEvent.click(usersNavBtn);

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-search-input')).toBeInTheDocument();
    });

    const searchUserInput = screen.getByTestId('admin-users-search-input');
    fireEvent.change(searchUserInput, { target: { value: 'roberto' } });

    await waitFor(() => {
      expect(screen.getByText('Roberto González')).toBeInTheDocument();
      expect(screen.queryByText('Carlos Mendoza')).not.toBeInTheDocument();
    });
  });

  // 8. Manejo de errores y reintentos en carga administrativa
  it('8. Muestra mensaje de error cuando falla la carga administrativa y permite reintentar', async () => {
    vi.spyOn(requestsApi, 'getRequests').mockRejectedValueOnce(new Error('Error de conectividad de red'));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getAllByText(/Error de conectividad de red/i).length).toBeGreaterThanOrEqual(1);
    });

    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Panel de Control, Diana/i })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // 9. Actualización de estado de solicitudes por Administrador
  it('9. Permite al administrador actualizar el estado del servicio a Concluida (T)', async () => {
    const updateSpy = vi.spyOn(requestsApi, 'updateStatus').mockResolvedValue({
      status: 'T',
      label: 'Concluida',
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /gestión de solicitudes/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/actualizar estado del servicio/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/nuevo estado/i);
    fireEvent.change(statusSelect, { target: { value: 'T' } });

    const submitBtn = screen.getByRole('button', { name: /confirmar cambio de estado/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('req-adm-1', 'T', undefined);
      expect(screen.getByText(/✓ Estado actualizado a/i)).toBeInTheDocument();
    });
  });

  // 10. Cierre de sesión seguro desde el Header
  it('10. Permite al administrador cerrar sesión de manera segura', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <AdminDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Panel de Control, Diana/i })).toBeInTheDocument();
    });

    // El botón de logout está en el Header
    const logoutBtn = screen.getByTitle(/cerrar sesión/i);
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('mira_token')).toBeNull();
      expect(localStorage.getItem('mira_user')).toBeNull();
    });
  });
});
