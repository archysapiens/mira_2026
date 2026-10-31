import React from 'react';
import type { ServiceRequest, DashboardCounts } from '../../../types';
import { formatNeed, formatDate, STATUS_CONFIG } from '../../../utils/formatters';

interface SummaryViewProps {
  userName?: string;
  isEmailVerified: boolean;
  counts: DashboardCounts;
  recentRequests: ServiceRequest[];
  onOpenOtpModal: () => void;
  onViewAllRequests: () => void;
  onSelectRequest: (requestId: string) => void;
  onViewProfile: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  userName = 'Cliente',
  isEmailVerified,
  counts,
  recentRequests,
  onOpenOtpModal,
  onViewAllRequests,
  onSelectRequest,
  onViewProfile,
}) => {
  const firstName = userName.trim().split(' ')[0] || 'Cliente';
  const totalCount = counts.E + counts.A + counts.T + counts.C;

  return (
    <div className="space-y-6">
      {/* A. Hero de Bienvenida */}
      <section className="bg-gradient-to-br from-white via-[#F5F9FD] to-[#EBF4FA] border border-[#DCE6EF] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-3 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#062D3A] leading-tight">
            Hola, <span className="text-[#1E6091]">{firstName}</span> 👋
          </h2>
          <p className="text-base font-bold text-[#062D3A]">
            Consulta y da seguimiento a tus servicios MIRA.
          </p>
          <p className="text-xs md:text-sm text-[#56696D] leading-relaxed">
            Nos encargamos de mantener en movimiento lo que más te importa. Monitorea el avance técnico de cada una de tus solicitudes en tiempo real.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onViewAllRequests}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-xs shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>+ Cotizar servicio</span>
            </button>
          </div>
        </div>

        {/* Visual Badge Card */}
        <div className="w-full md:w-72 shrink-0 bg-white rounded-xl border border-[#DCE2DD] p-4 shadow-sm flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#062D3A] text-[#7AC143] font-bold text-xl flex items-center justify-center">
            M
          </div>
          <p className="text-xs font-bold text-[#062D3A]">
            Instalaciones que hacen crecer tu mañana
          </p>
          <span className="text-[11px] text-[#56696D]">
            MIRA Soluciones Integrales
          </span>
        </div>
      </section>

      {/* B. Métricas Reales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <article className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#062D3A] leading-tight" data-testid="metric-total">
              {totalCount}
            </div>
            <div className="text-xs font-bold text-[#062D3A]">Total solicitudes</div>
            <div className="text-[11px] text-[#8E9FA2]">Todas tus solicitudes</div>
          </div>
        </article>

        {/* Enviadas */}
        <article className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#062D3A] leading-tight" data-testid="metric-sent">
              {counts.E}
            </div>
            <div className="text-xs font-bold text-[#062D3A]">Enviadas</div>
            <div className="text-[11px] text-[#8E9FA2]">En revisión inicial</div>
          </div>
        </article>

        {/* En atención */}
        <article className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#062D3A] leading-tight" data-testid="metric-attended">
              {counts.A}
            </div>
            <div className="text-xs font-bold text-[#062D3A]">En atención</div>
            <div className="text-[11px] text-[#8E9FA2]">En proceso de servicio</div>
          </div>
        </article>

        {/* Terminadas */}
        <article className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#062D3A] leading-tight" data-testid="metric-completed">
              {counts.T}
            </div>
            <div className="text-xs font-bold text-[#062D3A]">Terminadas</div>
            <div className="text-[11px] text-[#8E9FA2]">Servicios completados</div>
          </div>
        </article>
      </section>

      {/* C. Grid Principal 70% / 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (70% ~ 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabla de Solicitudes Recientes */}
          <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8ECEF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#062D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 className="text-sm font-bold text-[#062D3A]">Solicitudes recientes</h3>
              </div>
              <button
                type="button"
                onClick={onViewAllRequests}
                className="text-xs font-bold text-[#1E6091] hover:text-[#00875A] transition-colors cursor-pointer"
              >
                Ver todas →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E8ECEF]">
                    <th className="px-5 py-3 text-[11px] font-extrabold text-[#56696D] uppercase tracking-wider">Folio</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-[#56696D] uppercase tracking-wider">Servicio / Necesidad</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-[#56696D] uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-[#56696D] uppercase tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-[#56696D] uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-xs text-[#8E9FA2]">
                        Aún no tienes solicitudes registradas.{' '}
                        <button
                          type="button"
                          onClick={onViewAllRequests}
                          className="font-bold text-[#00875A] hover:underline"
                        >
                          Haz clic aquí para cotizar un servicio
                        </button>
                        .
                      </td>
                    </tr>
                  ) : (
                    recentRequests.slice(0, 5).map((req) => {
                      const cfg = STATUS_CONFIG[req.Status] || STATUS_CONFIG.E;
                      return (
                        <tr key={req.RequestId} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-[#062D3A]">
                            <span className="px-2 py-1 bg-[#F1F5F9] rounded text-[11.5px] font-mono">
                              {req.Folio}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-bold text-[#062D3A]">
                            {formatNeed(req.Need)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badgeClass}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#56696D]">
                            {formatDate(req.CreatedAt)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onSelectRequest(req.RequestId)}
                              className="px-3 py-1 text-xs font-bold text-[#062D3A] bg-white border border-[#E8ECEF] hover:bg-[#062D3A] hover:text-white rounded transition-colors cursor-pointer"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Banner: ¿Necesitas un nuevo servicio? */}
          <div className="bg-white border border-[#E8ECEF] rounded-xl p-6 shadow-xs space-y-5">
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-[#062D3A]">¿Necesitas un nuevo servicio?</h3>
              <p className="text-xs text-[#56696D] leading-relaxed max-w-xl">
                Cuéntanos lo que necesitas y te ayudaremos a encontrar la mejor solución integral para tus instalaciones comerciales o residenciales.
              </p>
              <button
                type="button"
                onClick={onViewAllRequests}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-[#00875A] text-[#00875A] hover:bg-[#00875A] hover:text-white transition-colors cursor-pointer"
              >
                <span>Cotizar servicio →</span>
              </button>
            </div>

            {/* Categorías */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E8ECEF]">
              <div className="flex items-start gap-2.5">
                <span className="text-base">⚙️</span>
                <div>
                  <h4 className="text-xs font-bold text-[#062D3A]">Instalación</h4>
                  <p className="text-[11px] text-[#8E9FA2]">Equipos y sistemas</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🔧</span>
                <div>
                  <h4 className="text-xs font-bold text-[#062D3A]">Mantenimiento</h4>
                  <p className="text-[11px] text-[#8E9FA2]">Preventivo y correctivo</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🏢</span>
                <div>
                  <h4 className="text-xs font-bold text-[#062D3A]">Servicios generales</h4>
                  <p className="text-[11px] text-[#8E9FA2]">Soluciones a tu medida</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (30% ~ 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tarjeta de Verificación de Correo */}
          {isEmailVerified ? (
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center font-extrabold text-xs">
                  ✓
                </div>
                <h4 className="text-sm font-extrabold text-[#065F46]">Correo verificado</h4>
              </div>
              <p className="text-xs text-[#047857] leading-relaxed">
                Tu dirección de correo está verificada. ¡Gracias! Ahora puedes ver todas tus solicitudes vinculadas automáticamente.
              </p>
              <button
                type="button"
                onClick={onViewProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#A7F3D0] text-[#065F46] hover:bg-[#065F46] hover:text-white transition-colors cursor-pointer"
              >
                <span>Ver mi perfil →</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-black text-xs">
                  !
                </div>
                <h4 className="text-sm font-extrabold text-[#92400E]">Verifica tu correo</h4>
              </div>
              <p className="text-xs text-[#78350F] leading-relaxed">
                Verifica tu dirección de correo para vincular solicitudes realizadas antes de crear tu cuenta.
              </p>
              <button
                type="button"
                onClick={onOpenOtpModal}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg bg-[#062D3A] hover:bg-[#0C3E4F] text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Enviar código OTP →</span>
              </button>
            </div>
          )}

          {/* Tarjeta de Acciones Rápidas */}
          <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-[#062D3A] flex items-center gap-2">
              <span className="text-blue-600">⚡</span>
              <span>Acciones rápidas</span>
            </h4>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onViewAllRequests}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#F1F5F9] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                    📋
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#062D3A]">Mis solicitudes</p>
                    <p className="text-[10.5px] text-[#8E9FA2]">Consulta el estado actual</p>
                  </div>
                </div>
                <span className="text-[#94A3B8] text-xs">→</span>
              </button>

              <button
                type="button"
                onClick={onViewProfile}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#F1F5F9] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                    👤
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#062D3A]">Mi perfil</p>
                    <p className="text-[10.5px] text-[#8E9FA2]">Revisa tu información</p>
                  </div>
                </div>
                <span className="text-[#94A3B8] text-xs">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D. Beneficios Corporativos Strip */}
      <footer className="bg-white border border-[#E8ECEF] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <div>
            <p className="font-bold text-[#062D3A]">Atención profesional</p>
            <p className="text-[10.5px] text-[#8E9FA2]">Equipo especializado</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            ⏱️
          </div>
          <div>
            <p className="font-bold text-[#062D3A]">Seguimiento en tiempo real</p>
            <p className="text-[10.5px] text-[#8E9FA2]">Consulta el avance de tus solicitudes</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            🛡️
          </div>
          <div>
            <p className="font-bold text-[#062D3A]">Soluciones confiables</p>
            <p className="text-[10.5px] text-[#8E9FA2]">Calidad y seguridad</p>
          </div>
        </div>

        <div className="text-right border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto">
          <span className="text-[10px] font-extrabold text-[#8E9FA2] uppercase tracking-wider block">
            MIRA Soluciones Integrales
          </span>
        </div>
      </footer>
    </div>
  );
};
