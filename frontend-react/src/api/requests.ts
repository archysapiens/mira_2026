import { apiClient } from './client';
import type {
  ServiceRequest,
  DashboardResponse,
  WorkNote,
  ClaimRequestsResponse,
  RequestStatus,
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
} from '../types';

export const requestsApi = {
  /**
   * Crea una nueva solicitud de servicio / cotización pública o de cliente autenticado
   */
  createRequest: async (
    payload: CreateServiceRequestPayload
  ): Promise<CreateServiceRequestResponse> => {
    return apiClient<CreateServiceRequestResponse>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  /**
   * Obtiene la lista de solicitudes del usuario autenticado
   */
  getRequests: async (): Promise<ServiceRequest[]> => {
    return apiClient<ServiceRequest[]>('/requests', {
      method: 'GET',
    });
  },

  /**
   * Obtiene las métricas cuantitativas por estado para el dashboard
   */
  getDashboard: async (): Promise<DashboardResponse> => {
    return apiClient<DashboardResponse>('/dashboard', {
      method: 'GET',
    });
  },

  /**
   * Obtiene las notas de trabajo asociadas a una solicitud
   */
  getNotes: async (requestId: string): Promise<WorkNote[]> => {
    return apiClient<WorkNote[]>(`/requests/${requestId}/notes`, {
      method: 'GET',
    });
  },

  /**
   * Registra una nota de trabajo en la bitácora técnica de la solicitud (OPERATOR y ADMIN)
   */
  addNote: async (requestId: string, note: string): Promise<{ created: boolean }> => {
    return apiClient<{ created: boolean }>(`/requests/${requestId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  /**
   * Actualiza el estado de una solicitud (OPERATOR y ADMIN)
   */
  updateStatus: async (
    requestId: string,
    status: RequestStatus,
    comment?: string
  ): Promise<{ status: RequestStatus; label: string }> => {
    return apiClient<{ status: RequestStatus; label: string }>(`/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  },

  /**
   * Asigna un operador a una solicitud (Exclusivo para ADMIN)
   */
  assignOperator: async (
    requestId: string,
    operatorId: string
  ): Promise<{ updated: boolean }> => {
    return apiClient<{ updated: boolean }>(`/requests/${requestId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ operatorId }),
    });
  },

  /**
   * Reclama y vincula solicitudes públicas no asignadas que coincidan con el correo verificado
   */
  claimRequests: async (): Promise<ClaimRequestsResponse> => {
    return apiClient<ClaimRequestsResponse>('/requests/claim', {
      method: 'POST',
    });
  },
};
