import React from 'react';
import type { AdminView } from '../../../types';

interface SidebarNavItem {
  id: AdminView;
  label: string;
  ariaLabel: string;
  icon: string;
}

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
  const navItems: SidebarNavItem[] = [
    {
      id: 'summary',
      label: 'Inicio',
      ariaLabel: 'Inicio - Consola y Métricas',
      icon: '📊',
    },
    {
      id: 'requests',
      label: 'Cotizaciones',
      ariaLabel: 'Cotizaciones - Gestión de Solicitudes',
      icon: '📑',
    },
    {
      id: 'clients',
      label: 'Clientes',
      ariaLabel: 'Clientes - Cartera de Clientes',
      icon: '🏢',
    },
    {
      id: 'users',
      label: 'Operadores',
      ariaLabel: 'Operadores - Usuarios del Sistema',
      icon: '👷',
    },
    {
      id: 'reports',
      label: 'Reportes',
      ariaLabel: 'Reportes - Analítica y Rendimiento',
      icon: '📈',
    },
    {
      id: 'profile',
      label: 'Configuración',
      ariaLabel: 'Configuración - Ajustes y Cuenta',
      icon: '⚙️',
    },
  ];

  return (
    <>
      {/* Backdrop móvil */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#041E27]/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="appSidebar"
        className={`fixed top-0 bottom-0 left-0 w-56 bg-[#062D3A] text-white flex flex-col z-50 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 border-r border-white/10 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera Sidebar con logotipo MIRA compacto */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/mira-circle-192.png"
                alt="MIRA"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="text-lg font-black text-white tracking-tight leading-none">
                MIRA<span className="text-[#7AC143]">.</span>
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-wider text-[#8E9FA2] uppercase mt-2">
              Panel de Administración
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-white/60 hover:text-white rounded transition-colors"
            aria-label="Cerrar menú lateral"
          >
            ✕
          </button>
        </div>

        {/* Enlaces de Navegación Compactos */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.ariaLabel}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#7AC143] text-white font-bold shadow-xs'
                    : 'text-[#B0C4C8] hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                <span className="text-sm shrink-0 select-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
