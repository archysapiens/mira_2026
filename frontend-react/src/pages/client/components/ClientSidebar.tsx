import React from 'react';
import type { ClientView } from '../../../types';

interface ClientSidebarProps {
  currentView: ClientView;
  onSelectView: (view: ClientView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleNavClick = (view: ClientView) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop para móvil */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar Lateral Oscuro */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#062D3A] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 border-r border-white/10 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="appSidebar"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/assets/mira-circle-192.png"
              alt="MIRA"
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="text-xl font-extrabold text-white tracking-tight">
              MIRA<span className="text-[#7AC143]">.</span>
            </span>
          </div>
          <span className="text-[9.5px] font-bold tracking-widest text-[#8E9FA2] uppercase block mt-2">
            SOLUCIONES QUE MANTIENEN TU MUNDO
          </span>
        </div>

        {/* Menú de Navegación */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleNavClick('summary')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
              currentView === 'summary'
                ? 'bg-[#0C3E4F] text-white font-bold border-l-4 border-[#7AC143]'
                : 'text-[#B0C4C8] hover:bg-[#0C3E4F]/60 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('requests')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
              currentView === 'requests'
                ? 'bg-[#0C3E4F] text-white font-bold border-l-4 border-[#7AC143]'
                : 'text-[#B0C4C8] hover:bg-[#0C3E4F]/60 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Mis solicitudes</span>
          </button>

          <button
            type="button"
            disabled
            title="Próximamente disponible"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#8E9FA2]/60 cursor-not-allowed opacity-60 text-left"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h12M6 12h12M6 16h6" />
              </svg>
              <span>Cotizaciones</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#D2E2E5]">
              Próx.
            </span>
          </button>

          <button
            type="button"
            disabled
            title="Próximamente disponible"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#8E9FA2]/60 cursor-not-allowed opacity-60 text-left"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Órdenes de servicio</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#D2E2E5]">
              Próx.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('documents')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
              currentView === 'documents'
                ? 'bg-[#0C3E4F] text-white font-bold border-l-4 border-[#7AC143]'
                : 'text-[#B0C4C8] hover:bg-[#0C3E4F]/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>Documentos</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider text-[#D2E2E5]">
              Próx.
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
              currentView === 'profile'
                ? 'bg-[#0C3E4F] text-white font-bold border-l-4 border-[#7AC143]'
                : 'text-[#B0C4C8] hover:bg-[#0C3E4F]/60 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Mi perfil</span>
          </button>
        </nav>

        {/* Tarjeta inferior de soporte */}
        <div className="p-3 m-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#7AC143]/20 text-[#8CC63F] flex items-center justify-center text-xs">
              💬
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">¿Necesitas ayuda?</p>
              <p className="text-[10.5px] text-[#8E9FA2]">Estamos aquí para apoyarte</p>
            </div>
          </div>
          <a
            href="mailto:contacto@mira.com"
            className="block w-full py-1.5 text-center text-xs font-bold rounded-lg bg-white/10 hover:bg-[#00875A] text-white border border-white/15 transition-colors"
          >
            Contactar soporte
          </a>
        </div>

        {/* Marca inferior */}
        <div className="p-4 border-t border-white/5 flex items-center gap-2.5">
          <div className="w-1 h-6 bg-[#7AC143] rounded" />
          <span className="text-[10px] font-bold text-[#8E9FA2] uppercase tracking-wider leading-tight">
            Un mundo<br />en movimiento
          </span>
        </div>
      </aside>
    </>
  );
};
