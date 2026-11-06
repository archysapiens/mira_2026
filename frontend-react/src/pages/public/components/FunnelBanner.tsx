import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const FunnelBanner: React.FC = () => {
  const { openQuote } = useQuoteModal();

  return (
    <section id="cotizar" className="py-16 sm:py-24 bg-[#0b2633] text-white relative overflow-hidden">
      {/* Elementos visuales decorativos */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-[#79bd43]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-[#a8d24f]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-12 bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-xs">
          <div className="max-w-2xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#79bd43]/20 text-[#a8d24f] border border-[#79bd43]/30 tracking-wider uppercase">
              Solicitud Técnica Guiada
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
              Tu proyecto industrial empieza aquí.
            </h2>
            <p className="text-sm sm:text-base text-[#b8c9cb] leading-relaxed">
              Selecciona tu servicio, define especificaciones técnicas y obtén tu folio oficial de seguimiento en menos de 2 minutos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="#cotizar"
              id="btnStartQuoteBanner"
              onClick={(e) => {
                e.preventDefault();
                openQuote();
              }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#79bd43] hover:bg-[#68A635] text-white text-sm sm:text-base font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <span>Comenzar cotización</span>
              <span aria-hidden="true" className="text-lg">→</span>
            </a>
            <span className="text-[11px] text-[#b8c9cb] text-center">
              ✓ Sin compromiso · Folio oficial de asignación
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
