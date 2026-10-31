import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserSession, UserRole } from '../types';

/**
 * ============================================================================
 * SEGURIDAD Y GESTIÓN DE TOKENS JWT
 * ============================================================================
 * IMPORTANTE: La decodificación del token JWT en el navegador mediante Base64Url
 * se utiliza EXCLUSIVAMENTE para sincronizar el estado de la interfaz de usuario
 * (nombre, rol para navegación, verificación básica de expiración local).
 *
 * El almacenamiento de JWT en localStorage expone el token a ataques XSS si se
 * ejecutan scripts maliciosos. Para producción se recomienda migrar a cookies
 * HttpOnly con SameSite=Strict.
 *
 * La presencia de un token o rol en el cliente NO garantiza autenticación:
 * el backend de Azure Functions valida criptográficamente la firma con JWT_SECRET
 * y los permisos en cada petición HTTP.
 * ============================================================================
 */

export function parseJwt(token: string): { sub?: string; email?: string; name?: string; role?: string; exp?: number } | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload: string;
    try {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      jsonPayload = atob(base64);
    }
    const parsed = JSON.parse(jsonPayload);
    if (parsed && !parsed.name && parsed.fullName) {
      parsed.name = parsed.fullName;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case 'CLIENT':
      return '/cliente';
    case 'OPERATOR':
      return '/operador';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}

export interface AuthContextUser {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
}

interface AuthContextType {
  session: UserSession | null;
  user: AuthContextUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isEmailVerified: boolean;
  login: (token: string, user: { id: string | number; name: string; email: string; role: UserRole; emailVerified?: boolean }) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
  updateEmailVerified: (verified: boolean) => void;
  updateEmailVerifiedStatus: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialSession(): UserSession | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const token = localStorage.getItem('mira_token');
  const rawUser = localStorage.getItem('mira_user');

  if (!token || !rawUser) {
    return null;
  }

  const payload = parseJwt(token);
  if (!payload) {
    localStorage.removeItem('mira_token');
    localStorage.removeItem('mira_user');
    return null;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('mira_token');
    localStorage.removeItem('mira_user');
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    const role = ((payload.role || user.role || user.RoleCode || 'CLIENT') as string).toUpperCase() as UserRole;
    return {
      token,
      userId: String(payload.sub || user.id || user.UserId || ''),
      name: payload.name || user.name || user.FullName || 'Usuario',
      email: payload.email || user.email || user.Email || '',
      role,
      emailVerified: Boolean(user.emailVerified),
    };
  } catch {
    localStorage.removeItem('mira_token');
    localStorage.removeItem('mira_user');
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(getInitialSession);

  const clearSession = useCallback(() => {
    localStorage.removeItem('mira_token');
    localStorage.removeItem('mira_user');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('mira_logged_out', 'true');
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('mira_claimed_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    setSession(null);
  }, []);

  const isTokenExpired = useCallback((): boolean => {
    const currentToken = session?.token || localStorage.getItem('mira_token');
    if (!currentToken) return true;
    const payload = parseJwt(currentToken);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  }, [session]);

  const validateAndLoadSession = useCallback(() => {
    const initial = getInitialSession();
    if (!initial) {
      if (session) clearSession();
    } else if (!session || session.token !== initial.token) {
      setSession(initial);
    }
  }, [session, clearSession]);

  useEffect(() => {
    validateAndLoadSession();
  }, [validateAndLoadSession]);

  const login = (token: string, user: { id: string | number; name: string; email: string; role: UserRole; emailVerified?: boolean }) => {
    const payload = parseJwt(token);
    const role = (payload?.role ? payload.role.toUpperCase() : user.role.toUpperCase()) as UserRole;

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      emailVerified: Boolean(user.emailVerified),
    };

    localStorage.setItem('mira_token', token);
    localStorage.setItem('mira_user', JSON.stringify(userObj));
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('mira_logged_out');
    }

    setSession({
      token,
      userId: String(userObj.id),
      name: userObj.name,
      email: userObj.email,
      role,
      emailVerified: userObj.emailVerified,
    });
  };

  const logout = () => {
    clearSession();
  };

  const updateEmailVerified = (verified: boolean) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev, emailVerified: verified };
      try {
        const rawUser = localStorage.getItem('mira_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          u.emailVerified = verified;
          localStorage.setItem('mira_user', JSON.stringify(u));
        }
      } catch (err) {
        console.warn('Error al actualizar mira_user en localStorage:', err);
      }
      return updated;
    });
  };

  const user: AuthContextUser | null = session
    ? {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        emailVerified: session.emailVerified,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        token: session?.token || null,
        isAuthenticated: !!session,
        role: session?.role || null,
        isEmailVerified: Boolean(session?.emailVerified),
        login,
        logout,
        isTokenExpired,
        updateEmailVerified,
        updateEmailVerifiedStatus: updateEmailVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
