import React from 'react';
import type { UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { ThemeSelector } from '../common/ThemeSelector';

export interface HeaderProps {
  userName?: string;
  userRole?: UserRole;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  title?: string;
  subtitle?: string;
  hideLogo?: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: 'Cliente',
  OPERATOR: 'Operador',
  ADMIN: 'Administrador',
};

export const Header: React.FC<HeaderProps> = ({
  userName = 'Usuario MIRA',
  userRole = 'CLIENT',
  onLogout,
  onToggleSidebar,
  title,
  subtitle,
  hideLogo = false,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white dark:bg-[#071E26] border-b border-[#E8ECEF] dark:border-[#163D4E] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(6,45,58,0.02)] transition-colors">
      {/* Left: Mobile hamburger & Logo/Title */}
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-[#062D3A] dark:text-[#E2E8F0] hover:bg-[#F4F6F4] dark:hover:bg-[#0C3242] rounded-lg transition-colors cursor-pointer"
            aria-label="Alternar menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {hideLogo ? (
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black text-[#062D3A] dark:text-white tracking-tight leading-tight">
              {title || 'Cotizaciones'}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[#56696D] dark:text-[#94A3B8] hidden sm:block leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src="/assets/mira-circle-192.png"
              alt="MIRA"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div>
              <span className="text-base font-extrabold text-[#062D3A] dark:text-white tracking-tight block leading-tight">
                MIRA<span className="text-[#7AC143]">.</span>
              </span>
              {title && (
                <span className="text-xs text-[#56696D] dark:text-[#94A3B8] hidden sm:block">
                  {title}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: User Identity & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Selector de Apariencia: Sol en claro, Luna en oscuro */}
        <ThemeSelector id="portalThemeToggleBtn" />

        {/* Notificaciones */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative p-2 text-[#56696D] dark:text-[#94A3B8] hover:text-[#062D3A] dark:hover:text-white hover:bg-[#F4F6F4] dark:hover:bg-[#0C3242] rounded-lg transition-colors cursor-pointer"
          title="Notificaciones de plataforma"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7AC143]" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E8ECEF] dark:border-[#163D4E]">
          <div className="w-8 h-8 rounded-full bg-[#062D3A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#7AC143]/40">
            {getInitials(userName)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#062D3A] dark:text-white leading-tight">
              {userName}
            </span>
            <div className="mt-0.5">
              <Badge
                variant="neutral"
                size="sm"
                label={ROLE_LABELS[userRole] || userRole}
                dot={false}
              />
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-[#56696D] dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};
