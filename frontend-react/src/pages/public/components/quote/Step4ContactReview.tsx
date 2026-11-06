import React, { useState } from 'react';
import { getServiceNameByCode } from '../../../../data/servicePillars';

interface Step4ContactReviewProps {
  selectedServiceIds: string[];
  state: string;
  municipality: string;
  requestedDate: string;
  urgency: string;
  contactName: string;
  phone: string;
  company: string;
  email: string;
  isSubmitting: boolean;
  submissionError: string | null;
  onUpdate: (fields: Partial<{
    contactName: string;
    phone: string;
    company: string;
    email: string;
  }>) => void;
  onSubmit: () => void;
  onBack: () => void;
  onJumpToStep?: (step: number) => void;
}

export const Step4ContactReview: React.FC<Step4ContactReviewProps> = ({
  selectedServiceIds,
  state,
  municipality,
  requestedDate,
  urgency = 'Normal',
  contactName,
  phone,
  company,
  email,
  isSubmitting,
  submissionError,
  onUpdate,
  onSubmit,
  onBack,
  onJumpToStep,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!contactName.trim()) {
      errs.contactName = 'Ingresa tu nombre o el de la persona de contacto.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido (ej. contacto@empresa.com).';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length < 10) {
      errs.phone = 'Ingresa un número telefónico de contacto a 10 dígitos.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      onSubmit();
    }
  };

  const serviceNames = selectedServiceIds.map((code) => getServiceNameByCode(code));

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-[#EEF7E6] text-[#2D6619] border border-[#C8E6B2]">
            ETAPA 4 DE 4 · CONTACTO Y RESUMEN
          </span>
          <span className="text-xs text-[#56696D]">Confirmación de propuesta</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1.5">
          ¿A quién dirigimos la cotización técnica?
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-0.5">
          Proporciona tus datos para emitir el folio oficial y contactarte con la propuesta.
        </p>
      </div>

      {/* Tarjeta de Resumen Ejecutivo Pre-Envío */}
      <div className="bg-[#062D3A] text-white rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="text-[11px] font-bold text-[#7AC143] uppercase tracking-wider flex items-center gap-1.5">
            <span>📋</span> Resumen de tu requerimiento
          </span>
          {onJumpToStep && (
            <button
              type="button"
              onClick={() => onJumpToStep(1)}
              className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
            >
              Modificar servicios
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Servicios ({selectedServiceIds.length})
            </span>
            <div className="font-bold text-white mt-0.5 line-clamp-2">
              {serviceNames.join(', ') || 'No especificado'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Ubicación
            </span>
            <div className="font-bold text-white mt-0.5 truncate">
              {municipality ? `${municipality}, ${state}` : state || 'No especificada'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Fecha y Urgencia
            </span>
            <div className="font-bold text-white mt-0.5 flex items-center gap-1.5 truncate">
              <span>{requestedDate || 'Abierta'}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                  urgency === 'Alta' ? 'bg-amber-400 text-amber-950' : 'bg-[#7AC143] text-white'
                }`}
              >
                {urgency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Contacto */}
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="quoteContactName"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Nombre completo *
            </label>
            <input
              id="quoteContactName"
              type="text"
              value={contactName}
              onChange={(e) => {
                onUpdate({ contactName: e.target.value });
                setErrors((prev) => ({ ...prev, contactName: '' }));
              }}
              placeholder="Ej. Ing. Roberto Morales"
              required
              autoComplete="name"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.contactName ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.contactName && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.contactName}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteContactEmail"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Correo electrónico corporativo / personal *
            </label>
            <input
              id="quoteContactEmail"
              type="email"
              value={email}
              onChange={(e) => {
                onUpdate({ email: e.target.value });
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="correo@empresa.com"
              required
              autoComplete="email"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.email ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.email && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.email}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="quoteContactPhone"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Teléfono directo / WhatsApp (10 dígitos) *
            </label>
            <input
              id="quoteContactPhone"
              type="tel"
              value={phone}
              onChange={(e) => {
                onUpdate({ phone: e.target.value });
                setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="Ej. 722 555 0100"
              required
              autoComplete="tel"
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.phone ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.phone && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.phone}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteContactCompany"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Empresa / Razón Social (opcional)
            </label>
            <input
              id="quoteContactCompany"
              type="text"
              value={company}
              onChange={(e) => onUpdate({ company: e.target.value })}
              placeholder="Ej. Industrias del Centro S.A. de C.V."
              autoComplete="organization"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Alerta de Error de Envío si falló la API */}
      {submissionError && (
        <div
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold"
          role="alert"
        >
          {submissionError}
        </div>
      )}

      {/* Nota de Privacidad y Consentimiento */}
      <div className="text-[11px] text-[#56696D] leading-tight">
        Al hacer clic en enviar, autorizas a MIRA Soluciones Integrales a contactarte vía correo o
        teléfono para entregar tu propuesta técnica. No compartimos tu información con terceros.
      </div>

      {/* Botones de Navegación y Envío */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer disabled:opacity-40"
        >
          <span aria-hidden="true">←</span>
          <span>Regresar a Ubicación</span>
        </button>

        <button
          type="submit"
          id="btnSubmitQuote"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generando folio oficial...</span>
            </>
          ) : (
            <>
              <span>Enviar solicitud de cotización</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
