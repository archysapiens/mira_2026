import React from 'react';
import { getInitials } from '../../../utils/formatters';

interface ClientHeaderProps {
  userName?: string;
  userRole?: string;
  onToggleMobileSidebar: () => void;
  onNotificationsClick: () => void;
  onLogout: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  userName = 'Cliente',
  userRole = 'Cliente',
  onToggleMobileSidebar,
  onNotificationsClick,
  onLogout,
}) => {
  return (
    <header className="h-[72px] bg-white border-b border-[#E8ECEF] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_4px_rgba(6,45,58,0.03)]">
      {/* Lado izquierdo: Botón Drawer móvil + Títulos */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menú de navegación"
          className="lg:hidden p-2 rounded-lg text-[#062D3A] hover:bg-[#F4F7F9] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <img
          src="/assets/mira-circle-192.png"
          alt="MIRA"
          className="w-8 h-8 object-contain shrink-0 lg:hidden"
        />

        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[#062D3A] leading-tight">
            Portal Cliente
          </h1>
          <p className="text-xs text-[#56696D] hidden sm:block">
            Consulta y da seguimiento a tus servicios
          </p>
        </div>
      </div>

      {/* Lado derecho: Campana de Notificación + Píldora de Usuario */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Campana */}
        <button
          type="button"
          onClick={onNotificationsClick}
          title="Notificaciones"
          className="relative p-2 text-[#56696D] hover:text-[#062D3A] hover:bg-[#F1F5F9] rounded-full transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E05238] rounded-full border border-white" />
        </button>

        {/* Píldora de Perfil */}
        <div className="flex items-center gap-2.5 p-1.5 pr-3 bg-white border border-[#E8ECEF] rounded-full hover:border-[#7AC143] transition-colors shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#0C3E4F] text-white flex items-center justify-center font-extrabold text-xs">
            {getInitials(userName)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-[#062D3A] leading-tight truncate max-w-[130px]">
              {userName}
            </span>
            <span className="text-[10px] text-[#56696D] leading-tight">
              {userRole}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1 text-[#8E9FA2] hover:text-[#9B2C1D] transition-colors rounded cursor-pointer ml-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
