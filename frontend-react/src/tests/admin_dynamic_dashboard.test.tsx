import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminSummaryView } from '../pages/admin/components/AdminSummaryView';
import { QuoteDetailView } from '../pages/admin/components/QuoteDetailView';
import type { ServiceRequest, AuthUser, SystemUser, DashboardCounts } from '../types';

const mockAdminUser: AuthUser = {
  id: 1,
  email: 'admin.general@mira.com',
  name: 'Diana Administradora',
  role: 'ADMIN',
  emailVerified: true,
};

const mockOperators: SystemUser[] = [
  {
    UserId: 'op-01',
    FullName: 'Carlos Mendoza Especialista',
    Email: 'carlos@mira.com',
    RoleCode: 'OPERATOR',
    IsActive: true,
  },
  {
    UserId: 'op-02',
    FullName: 'Laura Torres Técnica',
    Email: 'laura@mira.com',
    RoleCode: 'OPERATOR',
    IsActive: true,
  },
];

const createSampleRequests = (): ServiceRequest[] => [
  {
    RequestId: 'req-01',
    Folio: 'MIRA-COT-2026-0001',
    ContactName: 'Ing. Fernando Morales',
    Email: 'fmorales@aceronorte.com',
    Phone: '8182345678',
    Company: 'Aceros Industriales del Norte',
    Location: 'Nuevo León - Apodaca',
    Need: 'Electricidad (Transformadores y Subestaciones)',
    Urgency: 'Alta',
    Description: 'Mantenimiento urgente a transformador seco de 750kVA.',
    Status: 'E', // Nueva / Enviada
    CreatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'req-02',
    Folio: 'MIRA-COT-2026-0002',
    ContactName: 'Lic. Claudia Villarreal',
    Email: 'claudia@parquemonterrey.com',
    Phone: '8189876543',
    Company: 'Parque Industrial Monterrey Sur',
    Location: 'Nuevo León - Santa Catarina',
    Need: 'Climatización (Chillers y Ventilación Central)',
    Urgency: 'Media',
    Description: 'Mantenimiento preventivo a sistema de agua helada.',
    Status: 'A', // En atención / Asignada
    CreatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    AssignedOperatorId: 'op-01',
    OperatorName: 'Carlos Mendoza Especialista',
  },
  {
    RequestId: 'req-03',
    Folio: 'MIRA-COT-2026-0003',
    ContactName: 'Ing. Rodrigo Zárate',
    Email: 'rzarate@logisticabajio.com',
    Phone: '4771239876',
    Company: 'Logística Integral Bajío',
    Location: 'Guanajuato - Silao',
    Need: 'Pintura e Impermeabilización (Epóxicos Industriales)',
    Urgency: 'Baja',
    Description: 'Recubrimiento epóxico en 1,800 m2 de piso.',
    Status: 'T', // Concluida / Aprobada
    CreatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    AssignedOperatorId: 'op-01',
    OperatorName: 'Carlos Mendoza Especialista',
  },
  {
    RequestId: 'req-04',
    Folio: 'MIRA-COT-2026-0004',
    ContactName: 'Q.F.B. Marcela Treviño',
    Email: 'mtrevino@sanpablofarma.com',
    Phone: '5557890123',
    Company: 'Laboratorios Farmacéuticos San Pablo',
    Location: 'Estado de México - Toluca',
    Need: 'Fumigación y Desinfección (Grado Quirúrgico)',
    Urgency: 'Alta',
    Description: 'Sanitización en cuartos limpios ISO Clase 7.',
    Status: 'E', // Nueva / Enviada
    CreatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'req-05',
    Folio: 'MIRA-COT-2026-0005',
    ContactName: 'Arq. Jorge Peñaloza',
    Email: 'jpenaloza@desarrollosmetro.com',
    Phone: '5554321098',
    Company: 'Desarrollos Comerciales Metro',
    Location: 'Ciudad de México - Álvaro Obregón',
    Need: 'Climatización e Instalaciones',
    Urgency: 'Baja',
    Description: 'Solicitud cancelada por duplicidad.',
    Status: 'C', // Cancelada
    CreatedAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
];

describe('MIRA — Dashboard Dinámico y Expediente de Cotización (Auditoría Técnica)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    localStorage.setItem('mira_token', 'mock_valid_token');
    localStorage.setItem('mira_user', JSON.stringify(mockAdminUser));
  });

  // 1. Dashboard: Métricas calculadas dinámicamente desde solicitudes (Cero hardcoded)
  it('1. Calcula métricas ejecutivas y KPIs dinámicamente según las solicitudes reales', () => {
    const sampleReqs = createSampleRequests();
    // 5 solicitudes en total: E=2, A=1, T=1, C=1
    const counts: DashboardCounts = { E: 2, A: 1, T: 1, C: 1 };

    render(
      <AdminSummaryView
        userName="Diana Administradora"
        counts={counts}
        requests={sampleReqs}
        onSelectRequest={vi.fn()}
        onViewAllRequests={vi.fn()}
        onNavigateToUsers={vi.fn()}
        onNavigateToNotes={vi.fn()}
      />
    );

    // Comprobar que no existen números inventados de la maqueta
    expect(screen.queryByText('1,248')).not.toBeInTheDocument();
    expect(screen.queryByText('186')).not.toBeInTheDocument();
    expect(screen.queryByText('241')).not.toBeInTheDocument();
    expect(screen.queryByText('302')).not.toBeInTheDocument();

    // Comprobar que los KPIs muestran los valores calculados de las solicitudes
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // Total Plataforma
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Enviadas / Recibidas (E)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // A=1, T=1, C=1

    // Comprobar etiquetas oficiales
    expect(screen.getByText('Total Plataforma')).toBeInTheDocument();
    expect(screen.getAllByText('Enviadas / Recibidas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('En Atención / Proceso').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Concluidas con Éxito').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Canceladas').length).toBeGreaterThanOrEqual(1);
  });

  // 2. Gráficas: Exclusivamente servicios industriales del catálogo MIRA
  it('2. Presenta exclusivamente servicios industriales MIRA y elimina categorías de transporte ajenas', () => {
    const sampleReqs = createSampleRequests();
    const counts: DashboardCounts = { E: 2, A: 1, T: 1, C: 1 };

    render(
      <AdminSummaryView
        userName="Diana Administradora"
        counts={counts}
        requests={sampleReqs}
        onSelectRequest={vi.fn()}
        onViewAllRequests={vi.fn()}
        onNavigateToUsers={vi.fn()}
        onNavigateToNotes={vi.fn()}
      />
    );

    // Categorías ajenas eliminadas
    expect(screen.queryByText(/transporte de personal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/transporte ejecutivo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/renta de unidades/i)).not.toBeInTheDocument();

    // Servicios industriales MIRA presentes en las solicitudes
    expect(screen.getAllByText(/electricidad/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/climatización/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/fumigación/i).length).toBeGreaterThanOrEqual(1);
  });

  // 3. Manejo de estado vacío en Dashboard cuando no existen solicitudes
  it('3. Muestra estado vacío elegante cuando requests está vacío, sin inventar datos', () => {
    const counts: DashboardCounts = { E: 0, A: 0, T: 0, C: 0 };

    render(
      <AdminSummaryView
        userName="Diana Administradora"
        counts={counts}
        requests={[]}
        onSelectRequest={vi.fn()}
        onViewAllRequests={vi.fn()}
        onNavigateToUsers={vi.fn()}
        onNavigateToNotes={vi.fn()}
      />
    );

    // Conteo total es 0
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/no hay solicitudes registradas actualmente/i)).toBeInTheDocument();
    expect(screen.getByText(/sin servicios registrados en la plataforma/i)).toBeInTheDocument();
    expect(screen.getByText(/no existen cotizaciones registradas actualmente/i)).toBeInTheDocument();
  });

  // 4. Expediente: Datos originales del cliente son de SOLO LECTURA
  it('4. Expediente presenta datos originales del cliente como solo lectura (inmutables)', () => {
    const sampleReq = createSampleRequests()[0];

    render(
      <QuoteDetailView
        request={sampleReq}
        operators={mockOperators}
        notes={[]}
        isLoadingNotes={false}
        isAssigning={false}
        isUpdatingStatus={false}
        onAssignOperator={vi.fn()}
        onUpdateStatus={vi.fn()}
        onAddNote={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Verificar banner de solo lectura
    expect(screen.getByText(/datos de la solicitud \(solo lectura\)/i)).toBeInTheDocument();
    expect(screen.getByText(/registro histórico del cliente/i)).toBeInTheDocument();

    // Datos del cliente desplegados
    expect(screen.getAllByText('MIRA-COT-2026-0001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Ing\. Fernando Morales/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Aceros Industriales del Norte/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('fmorales@aceronorte.com')).toBeInTheDocument();
    expect(screen.getByText('8182345678')).toBeInTheDocument();
    expect(screen.getByText(/mantenimiento urgente a transformador seco de 750kva/i)).toBeInTheDocument();

    // No existen inputs de edición para los campos históricos del cliente
    expect(screen.queryByDisplayValue('Ing. Fernando Morales')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('fmorales@aceronorte.com')).not.toBeInTheDocument();
  });

  // 5. Expediente: Gestión administrativa contiene controles de estado y operador
  it('5. Expediente provee controles autorizados para cambio de estado y asignación de operador', async () => {
    const sampleReq = createSampleRequests()[0];
    const updateStatusMock = vi.fn().mockResolvedValue(undefined);
    const assignOperatorMock = vi.fn().mockResolvedValue(undefined);

    render(
      <QuoteDetailView
        request={sampleReq}
        operators={mockOperators}
        notes={[]}
        isLoadingNotes={false}
        isAssigning={false}
        isUpdatingStatus={false}
        onAssignOperator={assignOperatorMock}
        onUpdateStatus={updateStatusMock}
        onAddNote={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Verificar banner de gestión administrativa
    expect(screen.getByText(/gestión administrativa \(editable\)/i)).toBeInTheDocument();

    // 1. Probar actualización de estado
    const statusSelect = screen.getByLabelText(/nuevo estado/i);
    fireEvent.change(statusSelect, { target: { value: 'A' } });

    const submitStatusBtn = screen.getByRole('button', { name: /confirmar cambio de estado/i });
    fireEvent.click(submitStatusBtn);

    await waitFor(() => {
      expect(updateStatusMock).toHaveBeenCalledWith('A', undefined);
    });

    // 2. Probar asignación de operador
    const assignSelect = screen.getByLabelText(/asignación de especialista/i);
    fireEvent.change(assignSelect, { target: { value: 'op-01' } });

    const submitAssignBtn = screen.getByRole('button', { name: /asignar especialista/i });
    fireEvent.click(submitAssignBtn);

    await waitFor(() => {
      expect(assignOperatorMock).toHaveBeenCalledWith('op-01');
    });
  });

  // 6. Expediente: Prevención de doble clic durante guardado y deshabilitación en modo real para "Enviar cotización"
  it('6. Deshabilita acciones en proceso para prevenir envíos duplicados y restringe envío falso en modo real', () => {
    const sampleReq = createSampleRequests()[0];

    // Simular isUpdatingStatus = true
    const { rerender } = render(
      <QuoteDetailView
        request={sampleReq}
        operators={mockOperators}
        notes={[]}
        isLoadingNotes={false}
        isAssigning={false}
        isUpdatingStatus={true}
        onAssignOperator={vi.fn()}
        onUpdateStatus={vi.fn()}
        onAddNote={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Botón de cambio de estado deshabilitado durante actualización
    const submitStatusBtn = screen.getByRole('button', { name: /actualizando\.\.\./i });
    expect(submitStatusBtn).toBeDisabled();

    // Rerender con isAssigning = true
    rerender(
      <QuoteDetailView
        request={sampleReq}
        operators={mockOperators}
        notes={[]}
        isLoadingNotes={false}
        isAssigning={true}
        isUpdatingStatus={false}
        onAssignOperator={vi.fn()}
        onUpdateStatus={vi.fn()}
        onAddNote={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const submitAssignBtn = screen.getByRole('button', { name: /asignando\.\.\./i });
    expect(submitAssignBtn).toBeDisabled();

    // Botón de Enviar en modo real (no demo) debe estar deshabilitado con aviso
    const sendBtn = screen.getByRole('button', { name: /enviar \(próximamente\)/i });
    expect(sendBtn).toBeDisabled();
  });
});
