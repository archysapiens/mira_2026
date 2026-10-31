/**
 * Cliente HTTP base para consumo de Azure Functions en MIRA
 */

import { isDemoMode } from '../utils/demoMode';
import { handleMockRequest } from './mockHandler';

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // Si está activo el modo demostración estático, responder con datos simulados
  if (isDemoMode()) {
    return handleMockRequest<T>(endpoint, options);
  }

  const token = localStorage.getItem('mira_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }

  return data as T;
}
