import React from 'react';
import type { UserRole } from '../../types';
import { Badge } from '../common/Badge';

export interface HeaderProps {
  userName?: string;
  userRole?: UserRole;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  title?: string;
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
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-[74px] bg-white border-b border-[#DCE2DD] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(6,45,58,0.03)]">
      {/* Left: Mobile hamburger & Logo/Title */}
      <div className="flex items-center gap-3 md:gap-5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-[#062D3A] hover:bg-[#F4F6F4] rounded-lg transition-colors cursor-pointer"
            aria-label="Alternar menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-3">
          <img
            src="/assets/mira-circle-192.png"
            alt="MIRA"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div>
            <span className="text-base font-extrabold text-[#062D3A] tracking-tight block leading-tight">
              MIRA<span className="text-[#7AC143]">.</span>
            </span>
            {title && (
              <span className="text-xs text-[#56696D] hidden sm:block">
                {title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: User Identity & Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-3 pl-3 md:pl-0 border-l md:border-l-0 border-[#DCE2DD]">
          <div className="w-10 h-10 rounded-full bg-[#062D3A] text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-[#7AC143]/30">
            {getInitials(userName)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#062D3A] leading-tight">
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
            className="p-2 text-[#56696D] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
