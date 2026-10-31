/**
 * Utilidades para detección y control del Modo Demostración en Sistema MIRA.
 * Permite ejecutar la aplicación 100% en el frontend con datos ficticios,
 * sin dependencias de Azure Functions ni SQL Server.
 */

export const isDemoMode = (): boolean => {
  // 1. Variable de entorno Vite (inyección en tiempo de compilación para Cloudflare Pages)
  if (import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE === 'demo') {
    return true;
  }

  // 2. Comprobación en navegador
  if (typeof window !== 'undefined') {
    // Parámetro en la URL: ?demo=true
    if (window.location.search.includes('demo=true')) {
      return true;
    }
    // Ruta explícita /demo
    if (window.location.pathname.startsWith('/demo')) {
      return true;
    }
    // Preferencia guardada en localStorage
    if (localStorage.getItem('mira_demo_mode') === 'true') {
      return true;
    }
  }

  return false;
};

export const setDemoMode = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('mira_demo_mode', 'true');
    } else {
      localStorage.removeItem('mira_demo_mode');
    }
  }
};

