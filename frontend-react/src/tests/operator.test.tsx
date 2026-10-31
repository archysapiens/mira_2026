import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { OperatorDashboardPage } from '../pages/operator/OperatorDashboardPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { requestsApi } from '../api/requests';
import type { ServiceRequest, AuthUser, WorkNote } from '../types';

const createMockToken = (payload: { id: string | number; email: string; name: string; role: string; exp: number }) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock_signature`;
};

const mockOperatorUser: AuthUser = {
  id: 10,
  email: 'carlos.operador@mira.com',
  name: 'Carlos Mendoza',
  role: 'OPERATOR',
  emailVerified: true,
};

const mockRequests: ServiceRequest[] = [
  {
    RequestId: 'req-op-1',
    Folio: 'SOL-2026-OP1',
    ContactName: 'Gerente Planta',
    Email: 'planta@acero.com',
    Company: 'Acero Regio SA',
    Location: 'Planta Monterrey',
    Need: 'ELECTRICIDAD',
    Urgency: 'Alta',
    Description: 'Revisión técnica urgente de transformador principal.',
    Status: 'E',
    CreatedAt: '2026-10-20T08:00:00Z',
    OperatorName: 'Carlos Mendoza',
  },
  {
    RequestId: 'req-op-2',
    Folio: 'SOL-2026-OP2',
    ContactName: 'Administrador Edificio',
    Email: 'torre@corporativo.com',
    Company: 'Corporativo Insurgentes',
    Location: 'Torre Central CDMX',
    Need: 'CLIMATIZACION',
    Urgency: 'Media',
    Description: 'Mantenimiento preventivo de unidades Chiller en azotea.',
    Status: 'A',
    CreatedAt: '2026-10-21T10:30:00Z',
    OperatorName: 'Carlos Mendoza',
  },
  {
    RequestId: 'req-op-3',
    Folio: 'SOL-2026-OP3',
    ContactName: 'Jefe de Almacén',
    Email: 'almacen@granos.com',
    Company: 'Granos del Bajío',
    Location: 'Guadalajara Centro',
    Need: 'FUMIGACION',
    Urgency: 'Baja',
    Description: 'Fumigación completa de silos de almacenamiento.',
    Status: 'T',
    CreatedAt: '2026-10-22T14:15:00Z',
    OperatorName: 'Carlos Mendoza',
  },
];

const mockNotes: WorkNote[] = [
  {
    WorkNoteId: 'note-001',
    Author: 'Carlos Mendoza',
    Note: 'Se realizó medición inicial de voltaje en bornes primarios.',
    CreatedAt: '2026-10-20T11:00:00Z',
  },
];

const mockDashboardResponse = {
  counts: { E: 1, A: 1, T: 1, C: 0 },
  labels: { E: 'Enviada', A: 'Atendida', T: 'Terminada', C: 'Cancelada' },
};

describe('MIRA - Pruebas del Panel de Operador (Fase 10)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    const token = createMockToken({
      id: mockOperatorUser.id,
      email: mockOperatorUser.email,
      name: mockOperatorUser.name,
      role: mockOperatorUser.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    localStorage.setItem('mira_token', token);
    localStorage.setItem('mira_user', JSON.stringify(mockOperatorUser));

    vi.spyOn(requestsApi, 'getDashboard').mockResolvedValue(mockDashboardResponse);
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);
    vi.spyOn(requestsApi, 'getNotes').mockResolvedValue(mockNotes);
  });

  // 1. Acceso autorizado para rol OPERATOR
  it('1. Permite el acceso autorizado a usuarios con rol OPERATOR y muestra el saludo inicial', async () => {
    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /¡Buen día, Carlos!/i })).toBeInTheDocument();
      expect(screen.getByText(/Jornada Operativa Activa/i)).toBeInTheDocument();
    });
  });

  // 2. Rechazo de otros roles (CLIENT es redirigido a /cliente)
  it('2. Deniega el acceso a usuarios con rol CLIENT y redirige hacia /cliente', async () => {
    const clientUser: AuthUser = {
      id: 5,
      email: 'cliente@test.com',
      name: 'Cliente Prueba',
      role: 'CLIENT',
      emailVerified: true,
    };
    const clientToken = createMockToken({
      id: 5,
      email: 'cliente@test.com',
      name: 'Cliente Prueba',
      role: 'CLIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem('mira_token', clientToken);
    localStorage.setItem('mira_user', JSON.stringify(clientUser));

    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/operador"
              element={
                <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                  <OperatorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/cliente" element={<div>Redirigido a Portal Cliente</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Redirigido a Portal Cliente')).toBeInTheDocument();
      expect(screen.queryByText(/Jornada Operativa Activa/i)).not.toBeInTheDocument();
    });
  });

  // 3. Listado de solicitudes asignadas
  it('3. Muestra el listado de servicios asignados al operador con folios y datos técnicos', async () => {
    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /¡Buen día, Carlos!/i })).toBeInTheDocument();
    });

    // Navegar a vista de solicitudes desde el sidebar
    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getAllByText('SOL-2026-OP1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('SOL-2026-OP2')).toBeInTheDocument();
      expect(screen.getByText('SOL-2026-OP3')).toBeInTheDocument();
    });
  });

  // 4. Búsqueda y filtros por estado y texto
  it('4. Permite filtrar y buscar solicitudes asignadas por texto y estado', async () => {
    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByTestId('operator-search-input')).toBeInTheDocument();
    });

    // Filtrar por texto "Insurgentes"
    const searchInput = screen.getByTestId('operator-search-input');
    fireEvent.change(searchInput, { target: { value: 'Insurgentes' } });

    await waitFor(() => {
      expect(screen.getByText(/1 servicio asignado/i)).toBeInTheDocument();
      expect(screen.getAllByText('SOL-2026-OP2').length).toBeGreaterThanOrEqual(1);
    });

    // Limpiar búsqueda y filtrar por estado 'T' (Terminada)
    fireEvent.change(searchInput, { target: { value: '' } });
    const statusSelect = screen.getByTestId('operator-status-filter');
    fireEvent.change(statusSelect, { target: { value: 'T' } });

    await waitFor(() => {
      expect(screen.getByText(/1 servicio asignado/i)).toBeInTheDocument();
      expect(screen.getAllByText('SOL-2026-OP3').length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Detalle de solicitud técnica
  it('5. Muestra el detalle técnico y especificaciones de la solicitud seleccionada', async () => {
    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    // La primera solicitud está seleccionada por defecto
    await waitFor(() => {
      expect(screen.getByText(/SERVICIO ASIGNADO A TI/i)).toBeInTheDocument();
      expect(screen.getByText('Acero Regio SA (Gerente Planta)')).toBeInTheDocument();
      expect(screen.getAllByText(/Planta Monterrey/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Revisión técnica urgente de transformador principal/i)).toBeInTheDocument();
    });
  });

  // 6. Actualización de estado permitida (E -> A)
  it('6. Permite al operador actualizar el estado de una solicitud y enviar comentarios', async () => {
    const updateSpy = vi.spyOn(requestsApi, 'updateStatus').mockResolvedValue({
      status: 'A',
      label: 'En atención',
    });

    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/actualizar estado del servicio/i)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/nuevo estado/i);
    fireEvent.change(statusSelect, { target: { value: 'A' } });

    const commentInput = screen.getByPlaceholderText(/motivo o comentario del cambio/i);
    fireEvent.change(commentInput, { target: { value: 'Técnico llegó al sitio y comenzó diagnóstico.' } });

    const submitBtn = screen.getByRole('button', { name: /confirmar cambio de estado/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('req-op-1', 'A', 'Técnico llegó al sitio y comenzó diagnóstico.');
      expect(screen.getByText(/✓ Estado actualizado/i)).toBeInTheDocument();
    });
  });

  // 7. Rechazo de estados idénticos o no modificados
  it('7. Impide el envío si el estado seleccionado es idéntico al actual', async () => {
    const updateSpy = vi.spyOn(requestsApi, 'updateStatus');

    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/actualizar estado del servicio/i)).toBeInTheDocument();
    });

    // El estado actual de req-op-1 es 'E'. El select tiene 'E'.
    const submitBtn = screen.getByRole('button', { name: /confirmar cambio de estado/i });
    expect(submitBtn).toBeDisabled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  // 8. Consulta de notas técnicas
  it('8. Consulta y muestra las notas técnicas registradas para el servicio', async () => {
    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(requestsApi.getNotes).toHaveBeenCalledWith('req-op-1');
      expect(screen.getByText(/Se realizó medición inicial de voltaje en bornes primarios/i)).toBeInTheDocument();
    });
  });

  // 9. Registro de notas de trabajo en bitácora (addNote)
  it('9. Permite al operador registrar un nuevo avance técnico en la bitácora', async () => {
    const addNoteSpy = vi.spyOn(requestsApi, 'addNote').mockResolvedValue({
      created: true,
    });

    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const requestsNavBtn = screen.getByRole('button', { name: /mis servicios asignados/i });
    fireEvent.click(requestsNavBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/registrar avance en bitácora/i)).toBeInTheDocument();
    });

    const noteTextarea = screen.getByLabelText(/registrar avance en bitácora/i);
    fireEvent.change(noteTextarea, {
      target: { value: 'Se reemplazó fusible de alta tensión y se restableció el transformador.' },
    });

    const submitNoteBtn = screen.getByRole('button', { name: /guardar nota en bitácora/i });
    fireEvent.click(submitNoteBtn);

    await waitFor(() => {
      expect(addNoteSpy).toHaveBeenCalledWith(
        'req-op-1',
        'Se reemplazó fusible de alta tensión y se restableció el transformador.'
      );
      expect(screen.getByText(/✓ Nota registrada exitosamente en la bitácora/i)).toBeInTheDocument();
    });
  });

  // 10. Manejo de errores de API y reintentos
  it('10. Muestra mensaje de error cuando falla la API y permite reintentar', async () => {
    vi.spyOn(requestsApi, 'getRequests').mockRejectedValueOnce(new Error('Fallo de conexión con el servidor'));

    render(
      <MemoryRouter initialEntries={['/operador']}>
        <AuthProvider>
          <OperatorDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getAllByText(/Fallo de conexión con el servidor/i).length).toBeGreaterThanOrEqual(1);
    });

    // Ahora simular que el reintento responderá con éxito
    vi.spyOn(requestsApi, 'getRequests').mockResolvedValue(mockRequests);

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /¡Buen día, Carlos!/i })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
