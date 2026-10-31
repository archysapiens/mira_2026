import React from 'react';
import type { AdminView, NavItem } from '../../../types';

interface AdminSidebarProps {
  currentView: AdminView;
  onSelectView: (view: AdminView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'summary',
      label: 'Inicio y Métricas',
      icon: '📊',
    },
    {
      id: 'requests',
      label: 'Gestión de Solicitudes',
      icon: '📑',
    },
    {
      id: 'notes',
      label: 'Bitácora Global',
      icon: '📋',
    },
    {
      id: 'users',
      label: 'Usuarios del Sistema',
      icon: '👥',
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: '⚙️',
    },
  ];

  return (
    <>
      {/* Backdrop móvil */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#041E27]/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="appSidebar"
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#062D3A] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 border-r border-white/10 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera Sidebar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/assets/mira-circle-192.png"
                alt="MIRA"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="text-xl font-extrabold text-white tracking-tight">
                MIRA<span className="text-[#7AC143]">.</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-400/30">
                Admin
              </span>
            </div>
            <span className="text-[9.5px] font-bold tracking-widest text-[#8E9FA2] uppercase block mt-2">
              CONSOLA DE ADMINISTRACIÓN
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-white/60 hover:text-white rounded"
            aria-label="Cerrar menú lateral"
          >
            ✕
          </button>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id as AdminView);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#0C3E4F] text-white font-bold border-l-4 border-[#7AC143]'
                    : 'text-[#B0C4C8] hover:bg-[#0C3E4F]/60 hover:text-white'
                }`}
              >
                <span className="text-sm shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tarjeta inferior */}
        <div className="p-3.5 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-[#082F3D] border border-white/10 text-xs text-[#B0C4C8] space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Control Global MIRA</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8E9FA2]">
              Asigna cuadrillas operativas, supervisa avances y audita la bitácora técnica.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

