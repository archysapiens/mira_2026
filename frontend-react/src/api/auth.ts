import { apiClient } from './client';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  RequestOtpResponse,
  VerifyOtpResponse,
  ClaimRequestsResponse,
} from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  requestEmailVerification: async (
    payload?: string | { email?: string }
  ): Promise<RequestOtpResponse> => {
    const email = typeof payload === 'string' ? payload : payload?.email;
    return apiClient<RequestOtpResponse>('/auth/request-email-verification', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
  },

  verifyEmail: async (
    emailOrPayload: string | { email: string; code: string },
    codeParam?: string
  ): Promise<VerifyOtpResponse> => {
    let email: string;
    let code: string;
    if (typeof emailOrPayload === 'object') {
      email = emailOrPayload.email;
      code = emailOrPayload.code;
    } else {
      email = emailOrPayload;
      code = codeParam || '';
    }
    return apiClient<VerifyOtpResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  claimRequests: async (): Promise<ClaimRequestsResponse> => {
    return apiClient<ClaimRequestsResponse>('/requests/claim', {
      method: 'POST',
    });
  },
};
