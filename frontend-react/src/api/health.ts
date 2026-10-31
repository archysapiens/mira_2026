import { apiClient } from './client';

export interface HealthResponse {
  service: string;
  status: string;
  utc: string;
}

export const healthApi = {
  checkHealth: (): Promise<HealthResponse> => {
    return apiClient<HealthResponse>('/health');
  },
};

