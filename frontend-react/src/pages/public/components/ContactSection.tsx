import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const ContactSection: React.FC = () => {
  const { openQuote } = useQuoteModal();
  return (
    <section className="py-16 sm:py-24 bg-white" id="contacto" aria-label="Contacto y atención comercial">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* COLUMNA IZQUIERDA: INFORMACIÓN COMERCIAL */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-[#7AC143] tracking-widest uppercase">
                Atención comercial
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#062D3A] tracking-tight">
                Hablemos de tu proyecto
              </h2>
              <p className="text-xs sm:text-sm text-[#56696D] leading-relaxed">
                Coordinamos y ejecutamos proyectos de mantenimiento, limpieza y construcción con cobertura nacional y atención técnica personalizada.
              </p>
            </div>

            <div className="space-y-4 py-2 border-y border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                  Dirección
                </span>
                <address className="not-italic text-xs sm:text-sm font-semibold text-[#062D3A] mt-0.5">
                  Colombia No. 301-A, Col. Las Américas, C.P. 50130, Toluca, Estado de México
                </address>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                  Teléfono directo
                </span>
                <a
                  href="tel:8005056270"
                  className="text-sm sm:text-base font-bold text-[#062D3A] hover:text-[#7AC143] transition-colors"
                >
                  800 505 62 70
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                  Correo electrónico
                </span>
                <a
                  href="mailto:mirasa@prodigy.net.mx"
                  className="text-xs sm:text-sm font-bold text-[#062D3A] hover:text-[#7AC143] transition-colors"
                >
                  mirasa@prodigy.net.mx
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="btnContactSectionQuote"
                onClick={() => openQuote()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <span>Cotizar servicio</span>
                <span aria-hidden="true">→</span>
              </button>
              <a
                href="https://wa.me/527222245131?text=Hola%20MIRA%2C%20me%20interesa%20solicitar%20informaci%C3%B3n%20sobre%20sus%20servicios"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-[#CBD5E1] text-[#062D3A] hover:bg-slate-50 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* COLUMNA DERECHA: MAPA VISUAL DE UBICACIÓN */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md min-h-[350px] bg-slate-100">
            <iframe
              src="https://maps.google.com/maps?q=Colombia+301-A,+Las+Am%C3%A9ricas,+50130+Toluca,+M%C3%A9x.&t=&z=15&ie=UTF8&iwloc=&output=embed"
              title="Ubicación oficial MIRA - Toluca, Estado de México"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="w-full h-full min-h-[350px] border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

