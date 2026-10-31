import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRedirectPathForRole } from '../context/AuthContext';
import type { UserRole } from '../types';
import { isDemoMode } from '../utils/demoMode';
import { DEMO_USERS, createMockJwt } from '../data/mockDemoData';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, role, isTokenExpired, login } = useAuth();
  const location = useLocation();
  const inDemo = isDemoMode();

  const isLoggedOut = typeof window !== 'undefined' && window.sessionStorage && sessionStorage.getItem('mira_logged_out') === 'true';

  // En modo demostración, auto-aprovisionar la identidad simulada correspondiente a este panel
  // si el usuario no ha cerrado sesión explícitamente y accede directamente por URL
  if (inDemo && allowedRoles && allowedRoles.length > 0 && !isLoggedOut) {
    const hasRole = isAuthenticated && !isTokenExpired() && role && allowedRoles.includes(role);
    if (!hasRole) {
      const targetRole = allowedRoles[0];
      const targetUser = DEMO_USERS[targetRole];
      if (targetUser) {
        const mockToken = createMockJwt(targetUser);
        login(mockToken, targetUser);
      }
    }
    return <>{children}</>;
  }

  // Comportamiento estricto en modo real de producción (invariable):
  // Si no está autenticado o el token ya expiró, redirigir al login
  if (!isAuthenticated || isTokenExpired()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especifican roles permitidos y el rol actual no está autorizado
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={getRedirectPathForRole(role)} replace />;
  }

  return <>{children}</>;
};
