/**
 * Sistema MIRA - Módulo Central de Autenticación y Control de Acceso por Roles (auth.js)
 * Maneja la sesión en localStorage, verificación de JWT y protección de rutas.
 */

(function (window) {
  'use strict';

  /**
   * Decodifica de forma segura la carga útil (payload) de un JWT en Base64Url
   */
  function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('Error al decodificar JWT:', e);
      return null;
    }
  }

  /**
   * Obtiene la sesión activa comprobando consistencia entre localStorage y firma JWT
   */
  function getAuthSession() {
    const token = localStorage.getItem('mira_token');
    const rawUser = localStorage.getItem('mira_user');

    if (!token || !rawUser) {
      return null;
    }

    let user = null;
    try {
      user = JSON.parse(rawUser);
    } catch (e) {
      clearSession();
      return null;
    }

    const jwtPayload = parseJwt(token);
    if (!jwtPayload) {
      clearSession();
      return null;
    }

    // Validar expiración si viene campo exp (en segundos)
    if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
      console.warn('Sesión expirada.');
      clearSession();
      return null;
    }

    // El rol oficial proviene prioritariamente de la firma del JWT (inmutable por el cliente)
    const role = (jwtPayload.role || user.role || user.RoleCode || '').toUpperCase();
    if (!role) {
      clearSession();
      return null;
    }

    const name = jwtPayload.name || user.name || user.FullName || user.email || 'Usuario';
    const email = jwtPayload.email || user.email || user.Email || '';
    const userId = jwtPayload.sub || user.id || user.UserId || '';

    return {
      token,
      user,
      role,
      name,
      email,
      userId,
      emailVerified: Boolean(user.emailVerified)
    };
  }

  /**
   * Determina la URL de la página interna según el rol
   */
  function getRedirectUrlForRole(role) {
    const normalized = (role || '').toUpperCase();
    switch (normalized) {
      case 'CLIENT':
        return 'cliente.html';
      case 'OPERATOR':
        return 'operador.html';
      case 'ADMIN':
        return 'admin.html';
      default:
        return 'login.html';
    }
  }

  /**
   * Limpia el almacenamiento de sesión
   */
  function clearSession() {
    localStorage.removeItem('mira_token');
    localStorage.removeItem('mira_user');
  }

  /**
   * Cierra sesión y redirige al login
   */
  function logout() {
    clearSession();
    window.location.href = 'login.html';
  }

  /**
   * Protege una página asegurando que:
   * 1. Haya sesión válida (token y datos).
   * 2. El rol del usuario coincida exactamente con allowedRole.
   * Si no hay sesión -> redirige a login.html
   * Si el rol no coincide -> redirige a la página correspondiente a su rol.
   * Retorna la sesión si es válida.
   */
  function protectPage(allowedRole) {
    const session = getAuthSession();

    if (!session) {
      clearSession();
      window.location.replace('login.html');
      throw new Error('Acceso no autenticado. Redirigiendo a login...');
    }

    if (allowedRole) {
      const targetRole = allowedRole.toUpperCase();
      if (session.role !== targetRole) {
        console.warn(`Rol no autorizado para esta página (${session.role} != ${targetRole}). Redirigiendo...`);
        const targetUrl = getRedirectUrlForRole(session.role);
        window.location.replace(targetUrl);
        throw new Error(`Acceso no autorizado para el rol ${session.role}. Redirigiendo...`);
      }
    }

    return session;
  }

  // Exportar al ámbito global de ventana
  window.MiraAuth = {
    parseJwt,
    getAuthSession,
    getRedirectUrlForRole,
    clearSession,
    logout,
    protectPage
  };

  // Alias para comodidad
  window.getAuthSession = getAuthSession;
  window.getRedirectUrlForRole = getRedirectUrlForRole;
  window.protectPage = protectPage;
  window.logout = logout;

})(window);
