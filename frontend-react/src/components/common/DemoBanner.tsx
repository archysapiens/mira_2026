import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isDemoMode } from '../../utils/demoMode';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS, createMockJwt } from '../../data/mockDemoData';

export const DemoBanner: React.FC = () => {
  const active = isDemoMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!active) return null;

  const handleSwitchRole = (role: 'CLIENT' | 'OPERATOR' | 'ADMIN') => {
    const targetUser = DEMO_USERS[role];
    const mockToken = createMockJwt(targetUser);
    login(mockToken, targetUser);

    if (role === 'CLIENT') navigate('/cliente');
    else if (role === 'OPERATOR') navigate('/operador');
    else if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <>
      <div
        id="demoBanner"
        className="bg-[#062D3A] text-white border-b-2 border-[#7AC143] px-3 py-1.5 text-xs z-50 sticky top-0 shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Indicador de Modo Demo */}
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7AC143] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7AC143]"></span>
            </span>
            <span className="font-extrabold tracking-wide uppercase text-[11px] text-[#7AC143]">
              Modo Demostración
            </span>
            <span className="text-[#8E9FA2] hidden sm:inline">|</span>
            <span className="text-slate-300 text-[11px] hidden md:inline">
              Entorno estático con datos simulados — 0 llamadas a base de datos
            </span>
          </div>

          {/* Selector Rápido de Roles */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-300 font-medium hidden sm:inline">
              Cambiar vista:
            </span>

            <button
              type="button"
              onClick={() => handleSwitchRole('CLIENT')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                user?.role === 'CLIENT'
                  ? 'bg-[#7AC143] text-[#062D3A]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              👤 Cliente
            </button>

            <button
              type="button"
              onClick={() => handleSwitchRole('OPERATOR')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                user?.role === 'OPERATOR'
                  ? 'bg-sky-400 text-[#062D3A]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🔧 Operador
            </button>

            <button
              type="button"
              onClick={() => handleSwitchRole('ADMIN')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-400 text-[#062D3A]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🛡️ Admin
            </button>

            {location.pathname !== '/' && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-slate-200 hover:bg-white/20 transition-colors cursor-pointer"
              >
                🌐 Inicio
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDetailsOpen(true)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Información de la demostración"
            >
              ℹ️
            </button>
          </div>
        </div>
      </div>

      {/* Modal explicativo para el cliente */}
      {isDetailsOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="bg-white text-[#062D3A] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <img src="/assets/mira-circle-192.png" alt="MIRA" className="w-8 h-8 object-contain" />
              <div>
                <h3 className="font-extrabold text-base text-[#062D3A]">Sistema MIRA — Demo Privada</h3>
                <span className="text-[10px] text-[#7AC143] font-bold tracking-wider uppercase">
                  Aislamiento y Seguridad Garantizados
                </span>
              </div>
            </div>

            <div className="text-xs text-[#56696D] space-y-2 leading-relaxed">
              <p>
                Esta versión demostrativa permite interactuar con todas las pantallas y módulos del sistema
                utilizando <strong>datos 100% ficticios</strong> almacenados en memoria.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>No se conecta a Azure SQL ni a bases de datos de producción.</li>
                <li>No genera folios oficiales ni envía correos reales.</li>
                <li>Los botones de acción mutativa simulan el comportamiento operativo.</li>
                <li>Puedes cambiar entre los 3 portales (Cliente, Operador y Admin) al instante.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-[#062D3A] text-white text-xs font-bold rounded-xl hover:bg-[#0C3E4F] transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

