import { apiClient } from './client';
import type { SystemUser, UserRole } from '../types';

export interface CreateUserData {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
}

export const usersApi = {
  /**
   * Obtiene el listado de usuarios del sistema (Exclusivo ADMIN)
   */
  getUsers: async (): Promise<SystemUser[]> => {
    return apiClient<SystemUser[]>('/users', {
      method: 'GET',
    });
  },

  /**
   * Crea un nuevo usuario en el sistema (Exclusivo ADMIN)
   */
  createUser: async (data: CreateUserData): Promise<{ id: string }> => {
    return apiClient<{ id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

