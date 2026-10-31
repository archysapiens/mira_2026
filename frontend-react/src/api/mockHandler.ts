/**
 * Manejador de peticiones simuladas para el Modo Demostración estático.
 * Intercepta las llamadas a /api/* y responde con datos en memoria.
 */

import { DEMO_USERS, createMockJwt, mockStore } from '../data/mockDemoData';
import type { RequestOptions } from './client';
import type { AuthUser, RequestStatus } from '../types';

function getCurrentUserFromStorage(): AuthUser {
  try {
    const raw = localStorage.getItem('mira_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEMO_USERS.CLIENT;
}

export async function handleMockRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // Simular pequeña latencia de red para animaciones y spinners realistas
  await new Promise((resolve) => setTimeout(resolve, 80));

  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://dummy${endpoint}`);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // 1. Auth: Login
  if (pathname === '/auth/login' && method === 'POST') {
    const email = (body.email || '').toLowerCase().trim();
    let selectedUser = DEMO_USERS.CLIENT;
    if (
      email.includes('operador') ||
      email.includes('operator') ||
      email.includes('carlos') ||
      email.includes('tecnico')
    ) {
      selectedUser = DEMO_USERS.OPERATOR;
    } else if (email.includes('admin') || email.includes('mariana')) {
      selectedUser = DEMO_USERS.ADMIN;
    }

    const token = createMockJwt(selectedUser);
    return {
      token,
      user: selectedUser,
    } as unknown as T;
  }

  // 2. Auth: Register
  if (pathname === '/auth/register' && method === 'POST') {
    return {
      id: 'demo-user-new',
      email: body.email || DEMO_USERS.CLIENT.email,
      emailVerified: true,
      message: 'Cuenta creada exitosamente en modo demostración.',
    } as unknown as T;
  }

  // 3. Auth: Verify Email & Resend
  if (pathname === '/auth/verify-email' || pathname === '/auth/resend-verification') {
    return {
      verified: true,
      emailVerified: true,
      message: 'Operación simulada completada exitosamente.',
    } as unknown as T;
  }

  // 4. Auth: Me
  if (pathname === '/auth/me' && method === 'GET') {
    const user = getCurrentUserFromStorage();
    return { user } as unknown as T;
  }

  // 5. Auth: Logout
  if (pathname === '/auth/logout' && method === 'POST') {
    return { message: 'Sesión cerrada exitosamente.' } as unknown as T;
  }

  // 6. Requests: Dashboard Metrics (/dashboard o /requests/metrics)
  if ((pathname === '/dashboard' || pathname === '/requests/metrics') && method === 'GET') {
    const currentUser = getCurrentUserFromStorage();
    const counts = mockStore.getMetrics(currentUser.role, String(currentUser.id));
    return {
      counts,
      labels: {
        E: 'Enviadas',
        A: 'En Atención',
        T: 'Terminadas',
        C: 'Canceladas',
      },
      ...counts,
    } as unknown as T;
  }

  // 7. Requests: Claim
  if (pathname === '/requests/claim' && method === 'POST') {
    return { message: 'Solicitudes vinculadas correctamente.', claimedCount: 0, claimedFolios: [] } as unknown as T;
  }

  // 8. Requests: List (GET /requests)
  if (pathname === '/requests' && method === 'GET') {
    const currentUser = getCurrentUserFromStorage();
    let list = mockStore.getRequests(currentUser.role, String(currentUser.id));

    const statusFilter = searchParams.get('status');
    if (statusFilter) {
      list = list.filter((r) => r.Status === statusFilter);
    }

    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.Folio.toLowerCase().includes(q) ||
          (r.Description && r.Description.toLowerCase().includes(q)) ||
          r.ContactName.toLowerCase().includes(q)
      );
    }

    return list as unknown as T;
  }

  // 9. Requests: Create (POST /requests)
  if (pathname === '/requests' && method === 'POST') {
    const newReq = mockStore.createRequest(body);
    return {
      id: newReq.RequestId,
      folio: newReq.Folio,
      status: newReq.Status,
      message: 'Solicitud simulada registrada exitosamente.',
    } as unknown as T;
  }

  // 10. Requests: Specific Request by ID (/requests/:id)
  const reqMatch = pathname.match(/^\/requests\/([^/]+)$/);
  if (reqMatch && method === 'GET') {
    const reqId = reqMatch[1];
    const req = mockStore.getRequestById(reqId);
    if (!req) {
      throw new Error('Solicitud no encontrada');
    }
    return req as unknown as T;
  }

  // 11. Requests: Status Update (/requests/:id/status)
  const statusMatch = pathname.match(/^\/requests\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const reqId = statusMatch[1];
    const updated = mockStore.updateStatus(reqId, body.status as RequestStatus);
    const commentText = body.comment || body.comments;
    if (commentText) {
      const currentUser = getCurrentUserFromStorage();
      mockStore.addWorkNote(reqId, `[Estatus: ${body.status}]: ${commentText}`, currentUser.name);
    }
    return {
      status: updated.Status,
      label: body.status,
      message: 'Estatus actualizado exitosamente',
      request: updated,
    } as unknown as T;
  }

  // 12. Requests: Assign Operator (/requests/:id/assign)
  const assignMatch = pathname.match(/^\/requests\/([^/]+)\/assign$/);
  if (assignMatch && (method === 'PATCH' || method === 'POST')) {
    const reqId = assignMatch[1];
    const updated = mockStore.assignOperator(reqId, body.operatorId);
    return {
      updated: true,
      message: 'Operador asignado exitosamente',
      request: updated,
    } as unknown as T;
  }

  // 13. Requests: Notes List (/requests/:id/notes - GET)
  const notesMatch = pathname.match(/^\/requests\/([^/]+)\/notes$/);
  if (notesMatch && method === 'GET') {
    const reqId = notesMatch[1];
    const notes = mockStore.getWorkNotes(reqId);
    return notes as unknown as T;
  }

  // 14. Requests: Add Note (/requests/:id/notes - POST)
  if (notesMatch && method === 'POST') {
    const reqId = notesMatch[1];
    const currentUser = getCurrentUserFromStorage();
    const newNote = mockStore.addWorkNote(reqId, body.note, currentUser.name);
    return {
      created: true,
      note: newNote,
      message: 'Nota agregada exitosamente',
    } as unknown as T;
  }

  // 15. Admin: Users List (/users o /admin/users - GET)
  if ((pathname === '/users' || pathname === '/admin/users') && method === 'GET') {
    return mockStore.getSystemUsers() as unknown as T;
  }

  // 16. Admin: Create User (/users - POST)
  if (pathname === '/users' && method === 'POST') {
    const newUser = mockStore.createSystemUser(body);
    return {
      id: newUser.UserId,
      message: 'Usuario simulado creado exitosamente.',
    } as unknown as T;
  }

  // Respuesta por defecto simulada
  return { message: 'Operación simulada completada exitosamente' } as unknown as T;
}
