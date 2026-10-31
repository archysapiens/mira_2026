/**
 * Tipos fundamentales del Sistema MIRA
 */

export type UserRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export type RequestStatus = 'E' | 'A' | 'T' | 'C';

export type ClientView = 'summary' | 'requests' | 'documents' | 'profile';

export interface UserSession {
  token: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface StatusBadgeConfig {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  href?: string;
}

// Contratos de Autenticación
export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  emailVerified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
}

export interface RegisterResponse {
  id: string | number;
  email: string;
  emailVerified: boolean;
  message?: string;
}

export interface RequestOtpResponse {
  sent: boolean;
  expiresInMinutes: number;
  message: string;
  devCode?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  emailVerified: boolean;
  claimedCount?: number;
  claimedFolios?: string[];
  message?: string;
}

export interface ClaimRequestsResponse {
  claimedCount: number;
  claimedFolios: string[];
  message: string;
}

// Contratos del Portal de Solicitudes y Dashboard del Cliente
export interface ServiceRequest {
  RequestId: string;
  Folio: string;
  ContactName: string;
  Email?: string;
  Phone?: string;
  Company: string | null;
  Location: string;
  Need: string;
  Urgency: string | null;
  Description: string | null;
  Status: RequestStatus;
  CreatedAt: string;
  OperatorName?: string | null;
  AssignedOperatorId?: string | null;
}

export interface DashboardCounts {
  E: number;
  A: number;
  T: number;
  C: number;
}

export interface DashboardResponse {
  counts: Partial<Record<RequestStatus, number>>;
  labels?: Record<string, string>;
}

export interface WorkNote {
  WorkNoteId: string | number;
  Note: string;
  CreatedAt: string;
  Author: string;
}

export interface SystemUser {
  UserId: string;
  Email: string;
  FullName: string;
  IsActive: boolean;
  RoleCode: UserRole;
}

export type OperatorView = 'summary' | 'requests' | 'profile';
export type AdminView = 'summary' | 'requests' | 'notes' | 'users' | 'profile';

// Contratos del Cotizador Público
export type NeedType = 'HOTEL' | 'RESIDENCE' | 'COMPANY' | 'OTHER';

export interface QuoteFormData {
  needType: NeedType;
  serviceIds: string[];
  state: string;
  municipality: string;
  address: string;
  requestedDate: string;
  comments: string;
  description: string;
  contactName: string;
  phone: string;
  company: string;
  email: string;
}

export interface CreateServiceRequestPayload {
  contactName: string;
  email: string;
  phone?: string;
  company?: string;
  needType?: string;
  need?: string;
  serviceIds?: string[];
  state?: string;
  municipality?: string;
  address?: string;
  location?: string;
  requestedDate?: string;
  description?: string;
  comments?: string;
  urgency?: string;
  source?: string;
}

export interface CreateServiceRequestResponse {
  id: string;
  folio: string;
  status: RequestStatus;
}


