/**
 * Datos y Estado Simulado para la Demostración Privada de Cliente (Fase Demo)
 * Toda la información es estrictamente ficticia.
 * No contiene secretos, credenciales auténticas ni conexiones a bases de datos.
 */

import type { AuthUser, ServiceRequest, WorkNote, DashboardCounts, SystemUser, RequestStatus } from '../types';

export const DEMO_USERS: Record<string, AuthUser> = {
  CLIENT: {
    id: 'd748f2a1-09ab-4c3e-8f2b-1a2b3c4d5e6f',
    email: 'cliente.demo@mira-local.dev',
    name: 'Dra. Elena Soto Cliente',
    role: 'CLIENT',
    emailVerified: true,
  },
  OPERATOR: {
    id: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    email: 'operador.demo@mira-local.dev',
    name: 'Carlos Mendoza Técnico',
    role: 'OPERATOR',
    emailVerified: true,
  },
  ADMIN: {
    id: 'a123f456-789a-4bcd-ef01-23456789abcd',
    email: 'admin.demo@mira-local.dev',
    name: 'Ing. Mariana Valdés Admin',
    role: 'ADMIN',
    emailVerified: true,
  },
};

export const DEMO_SYSTEM_USERS: SystemUser[] = [
  {
    UserId: 'd748f2a1-09ab-4c3e-8f2b-1a2b3c4d5e6f',
    Email: 'cliente.demo@mira-local.dev',
    FullName: 'Dra. Elena Soto Cliente',
    IsActive: true,
    RoleCode: 'CLIENT',
  },
  {
    UserId: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    Email: 'operador.demo@mira-local.dev',
    FullName: 'Carlos Mendoza Técnico',
    IsActive: true,
    RoleCode: 'OPERATOR',
  },
  {
    UserId: 'a123f456-789a-4bcd-ef01-23456789abcd',
    Email: 'admin.demo@mira-local.dev',
    FullName: 'Ing. Mariana Valdés Admin',
    IsActive: true,
    RoleCode: 'ADMIN',
  },
];

// Codificador seguro UTF-8 a Base64Url para soportar acentos y caracteres especiales sin URIError
export function utf8ToBase64Url(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generador de JWT sintético para pruebas locales (sin secretos ni firma de producción)
export function createMockJwt(user: AuthUser): string {
  const header = utf8ToBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = utf8ToBase64Url(
    JSON.stringify({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
      fullName: user.name,
      emailVerified: user.emailVerified ?? true,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      iss: 'mira-demo-static',
    })
  );
  return `${header}.${payload}.mock_demo_signature`;
}

export const INITIAL_DEMO_NOTES: Record<string, WorkNote[]> = {
  'demo-cot-0041': [
    {
      WorkNoteId: 'note-041-1',
      Note: 'Recepción y validación de especificaciones técnicas para transformador de 750kVA. Cotización preliminar enviada a revisión técnica.',
      Author: 'Ing. Mariana Valdés Admin',
      CreatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ],
  'demo-cot-0042': [
    {
      WorkNoteId: 'note-042-1',
      Note: 'Visita de diagnóstico completada en sitio. Se revisaron 8 chillers en nave 3; programada recarga de gas y calibración.',
      Author: 'Carlos Mendoza Técnico',
      CreatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      WorkNoteId: 'note-042-2',
      Note: 'Refacciones y filtros de alta eficiencia validados en almacén central. Listo para ejecución.',
      Author: 'Carlos Mendoza Técnico',
      CreatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  'demo-req-102': [
    {
      WorkNoteId: 'note-101',
      Note: 'Visita de diagnóstico inicial completada en sitio. Se revisaron 8 unidades centrales de climatización (HVAC) en azotea; 2 requieren recarga de refrigerante ecológico y cambio de filtros de alta eficiencia.',
      Author: 'Carlos Mendoza Técnico',
      CreatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      WorkNoteId: 'note-102',
      Note: 'Filtros y refacciones entregados en caseta técnica. Se programa intervención de mantenimiento preventivo y calibración para mañana a las 09:00 hrs.',
      Author: 'Carlos Mendoza Técnico',
      CreatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  'demo-req-103': [
    {
      WorkNoteId: 'note-201',
      Note: 'Servicio de impermeabilización prefabricada y pintura acrílica concluido al 100%. Pruebas de estanqueidad y sellado de juntas aprobadas con póliza de garantía extendida de 5 años.',
      Author: 'Carlos Mendoza Técnico',
      CreatedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    },
  ],
};

export const INITIAL_DEMO_REQUESTS: ServiceRequest[] = [
  {
    RequestId: 'demo-cot-0041',
    Folio: 'MIRA-COT-2026-0041',
    ContactName: 'Ing. Fernando Morales',
    Email: 'fmorales@aceronorte.com.mx',
    Phone: '8182345678',
    Company: 'Aceros Industriales del Norte SA de CV',
    Location: 'Nuevo León - Apodaca - Parque Industrial Huinalá, Nave 4',
    Need: 'Electricidad (Transformadores y Subestaciones)',
    Urgency: 'Alta',
    Description: 'Mantenimiento predictivo y correctivo urgente a transformador seco de 750kVA y termografía a tablero general de distribución en planta siderúrgica.',
    Status: 'E', // Nueva / Enviada
    CreatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'demo-cot-0042',
    Folio: 'MIRA-COT-2026-0042',
    ContactName: 'Lic. Claudia Villarreal',
    Email: 'cvillarreal@parquemonterrey.mx',
    Phone: '8189876543',
    Company: 'Parque Industrial Monterrey Sur',
    Location: 'Nuevo León - Santa Catarina - Blvd. Gustavo Díaz Ordaz 400',
    Need: 'Climatización (Chillers y Ventilación Central)',
    Urgency: 'Media',
    Description: 'Revisión y mantenimiento preventivo de sistema de agua helada (Chillers) y balanceo térmico en oficinas corporativas y laboratorios.',
    Status: 'A', // Asignada / En atención
    CreatedAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    AssignedOperatorId: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    OperatorName: 'Carlos Mendoza Técnico',
  },
  {
    RequestId: 'demo-cot-0043',
    Folio: 'MIRA-COT-2026-0043',
    ContactName: 'Ing. Rodrigo Zárate',
    Email: 'rzarate@logisticabajio.com',
    Phone: '4771239876',
    Company: 'Logística Integral Bajío',
    Location: 'Guanajuato - Silao - Puerto Interior Nave C-12',
    Need: 'Pintura e Impermeabilización (Epóxicos Industriales)',
    Urgency: 'Normal',
    Description: 'Aplicación de recubrimiento epóxico de alta resistencia en 1,800 m² de piso de almacén y sellado de juntas de dilatación contra tránsito pesado.',
    Status: 'T', // Aprobada / Concluida
    CreatedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    AssignedOperatorId: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    OperatorName: 'Carlos Mendoza Técnico',
  },
  {
    RequestId: 'demo-cot-0044',
    Folio: 'MIRA-COT-2026-0044',
    ContactName: 'Q.F.B. Marcela Treviño',
    Email: 'mtrevino@sanpablofarma.com',
    Phone: '5557890123',
    Company: 'Laboratorios Farmacéuticos San Pablo',
    Location: 'Estado de México - Toluca - Zona Industrial Exportec II',
    Need: 'Fumigación y Desinfección (Grado Quirúrgico)',
    Urgency: 'Baja',
    Description: 'Sanitización con microdifusión en cuartos limpios ISO Clase 7 y control biológico integral para auditoría COFEPRIS.',
    Status: 'E', // En revisión
    CreatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'demo-cot-0045',
    Folio: 'MIRA-COT-2026-0045',
    ContactName: 'Arq. Jorge Peñaloza',
    Email: 'jpenaloza@desarrollosmetro.com',
    Phone: '5554321098',
    Company: 'Desarrollos Comerciales Metropolitana',
    Location: 'Ciudad de México - Álvaro Obregón - Av. Insurgentes Sur 1800',
    Need: 'Climatización e Instalaciones',
    Urgency: 'Baja',
    Description: 'Cotización desestimada por duplicidad de folio con contratista externo.',
    Status: 'C', // Cancelada
    CreatedAt: new Date(Date.now() - 3600000 * 140).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'demo-req-101',
    Folio: 'DEMO-2026-0101',
    ContactName: 'Dra. Elena Soto Cliente',
    Email: 'cliente.demo@mira-local.dev',
    Phone: '5551234567',
    Company: 'Corporativo Torre Diana',
    Location: 'Nuevo León - Monterrey - Av. Constitución 2050, Piso 12',
    Need: 'Empresa / Planta (Fumigación y Desinfección)',
    Urgency: 'Normal',
    Description: 'Servicio corporativo de fumigación biológica preventiva y desinfección de áreas comunes para planta de manufactura.',
    Status: 'E', // Enviada
    CreatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    AssignedOperatorId: null,
    OperatorName: null,
  },
  {
    RequestId: 'demo-req-102',
    Folio: 'DEMO-2026-0102',
    ContactName: 'Dra. Elena Soto Cliente',
    Email: 'cliente.demo@mira-local.dev',
    Phone: '5551234567',
    Company: 'Hotel Gran Regio Plaza',
    Location: 'Jalisco - Guadalajara - Av. Vallarta 1400',
    Need: 'Hotel / Hospedaje (Climatización e Instalaciones)',
    Urgency: 'Alta',
    Description: 'Mantenimiento preventivo integral a sistema de enfriamiento central y revisión de balanceo de cargas en subestación.',
    Status: 'A', // En Atención
    CreatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    AssignedOperatorId: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    OperatorName: 'Carlos Mendoza Técnico',
  },
  {
    RequestId: 'demo-req-103',
    Folio: 'DEMO-2026-0103',
    ContactName: 'Dra. Elena Soto Cliente',
    Email: 'cliente.demo@mira-local.dev',
    Phone: '5551234567',
    Company: 'Condominio Las Palmas',
    Location: 'Ciudad de México - Cuauhtémoc - Paseo de la Reforma 300',
    Need: 'Residencial / Condominio (Pintura e Impermeabilización)',
    Urgency: 'Baja',
    Description: 'Aplicación de impermeabilizante prefabricado 4.5mm y pintura de fachadas exteriores en torre residencial.',
    Status: 'T', // Terminada
    CreatedAt: new Date(Date.now() - 3600000 * 168).toISOString(),
    AssignedOperatorId: 'c837e1b2-10bc-4d4f-9a3c-2b3c4d5e6f7a',
    OperatorName: 'Carlos Mendoza Técnico',
  },
];

// Estado mutable en memoria durante la sesión demo
let mockRequestsState: ServiceRequest[] = [...INITIAL_DEMO_REQUESTS];
let mockNotesState: Record<string, WorkNote[]> = { ...INITIAL_DEMO_NOTES };
let mockUsersState: SystemUser[] = [...DEMO_SYSTEM_USERS];

export const mockStore = {
  getRequests: (role?: string, userId?: string): ServiceRequest[] => {
    if (role === 'CLIENT') {
      return [...mockRequestsState];
    }
    if (role === 'OPERATOR') {
      if (userId) {
        return mockRequestsState.filter((r) => r.AssignedOperatorId === userId || !r.AssignedOperatorId);
      }
      return [...mockRequestsState];
    }
    // ADMIN ve todas las solicitudes
    return [...mockRequestsState];
  },

  getMetrics: (role?: string, userId?: string): DashboardCounts => {
    const list = mockStore.getRequests(role, userId);
    return {
      E: list.filter((r) => r.Status === 'E').length,
      A: list.filter((r) => r.Status === 'A').length,
      T: list.filter((r) => r.Status === 'T').length,
      C: list.filter((r) => r.Status === 'C').length,
    };
  },

  getRequestById: (id: string): ServiceRequest | undefined => {
    const clean = (id || '').trim().toLowerCase();
    return mockRequestsState.find(
      (r) =>
        r.RequestId.toLowerCase() === clean ||
        r.Folio.toLowerCase() === clean ||
        r.Folio.toLowerCase().includes(clean)
    );
  },

  getSystemUsers: (): SystemUser[] => {
    return [...mockUsersState];
  },

  createSystemUser: (data: any): SystemUser => {
    const newUser: SystemUser = {
      UserId: `demo-usr-${Date.now()}`,
      FullName: data.fullName || 'Nuevo Usuario MIRA',
      Email: data.email || 'usuario@mira-local.dev',
      RoleCode: data.role || 'OPERATOR',
      IsActive: true,
    };
    mockUsersState = [newUser, ...mockUsersState];
    return newUser;
  },

  createRequest: (data: any): ServiceRequest => {
    const newFolio = `DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newId = `demo-req-${Date.now()}`;
    const newReq: ServiceRequest = {
      RequestId: newId,
      Folio: newFolio,
      ContactName: data.contactName || 'Contacto Demo',
      Email: data.email || 'cliente.demo@mira-local.dev',
      Phone: data.phone || '5550000000',
      Company: data.company || 'Empresa Demo',
      Location: data.location || 'Ubicación de Prueba',
      Need: data.need || 'Servicio General',
      Urgency: data.urgency || 'Normal',
      Description: data.description || 'Solicitud de Demostración',
      Status: 'E',
      CreatedAt: new Date().toISOString(),
      AssignedOperatorId: null,
      OperatorName: null,
    };
    mockRequestsState = [newReq, ...mockRequestsState];
    return newReq;
  },

  updateStatus: (id: string, status: RequestStatus): ServiceRequest => {
    mockRequestsState = mockRequestsState.map((r) => {
      if (r.RequestId === id || r.Folio === id) {
        return { ...r, Status: status };
      }
      return r;
    });
    return mockStore.getRequestById(id)!;
  },

  assignOperator: (id: string, operatorId: string): ServiceRequest => {
    const op = mockUsersState.find((u) => u.UserId === operatorId) ||
      Object.values(DEMO_USERS).find((u) => u.id === operatorId);
    const opName = op ? (('FullName' in op ? op.FullName : op.name) || 'Especialista Asignado') : 'Especialista Asignado';

    mockRequestsState = mockRequestsState.map((r) => {
      if (r.RequestId === id || r.Folio === id) {
        return {
          ...r,
          AssignedOperatorId: operatorId,
          OperatorName: opName,
          Status: r.Status === 'E' ? 'A' : r.Status,
        };
      }
      return r;
    });
    return mockStore.getRequestById(id)!;
  },

  getWorkNotes: (requestId: string): WorkNote[] => {
    if (mockNotesState[requestId]) return mockNotesState[requestId];
    const req = mockRequestsState.find((r) => r.RequestId === requestId || r.Folio === requestId);
    if (req && mockNotesState[req.RequestId]) return mockNotesState[req.RequestId];
    return [];
  },

  addWorkNote: (requestId: string, noteText: string, authorName = 'Especialista Técnico'): WorkNote => {
    const req = mockRequestsState.find((r) => r.RequestId === requestId || r.Folio === requestId);
    const key = req ? req.RequestId : requestId;
    const newNote: WorkNote = {
      WorkNoteId: `note-${Date.now()}`,
      Note: noteText,
      Author: authorName,
      CreatedAt: new Date().toISOString(),
    };
    if (!mockNotesState[key]) {
      mockNotesState[key] = [];
    }
    mockNotesState[key] = [newNote, ...mockNotesState[key]];
    return newNote;
  },

  reset: () => {
    mockRequestsState = [...INITIAL_DEMO_REQUESTS];
    mockNotesState = { ...INITIAL_DEMO_NOTES };
    mockUsersState = [...DEMO_SYSTEM_USERS];
  },
};
