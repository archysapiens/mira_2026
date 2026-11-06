import React, { useState } from 'react';
import type { NeedType } from '../../../../types';
import { MIRA_SERVICES } from '../../../../data/servicesCatalog';
import { funnelFormStyles } from './quoteFormStyles';

interface Step4ContactInfoProps {
  contactName: string;
  phone: string;
  company: string;
  email: string;
  isSubmitting: boolean;
  submissionError: string | null;
  needType?: NeedType;
  serviceIds?: string[];
  state?: string;
  municipality?: string;
  address?: string;
  requestedDate?: string;
  description?: string;
  onChange: (fields: Partial<{
    contactName: string;
    phone: string;
    company: string;
    email: string;
  }>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const SPACE_LABELS: Record<NeedType, string> = {
  HOTEL: 'Hotel / Hospedaje',
  RESIDENCE: 'Residencial / Condominio',
  COMPANY: 'Empresa / Planta',
  OTHER: 'Otro espacio',
};

export const Step4ContactInfo: React.FC<Step4ContactInfoProps> = ({
  contactName,
  phone,
  company,
  email,
  isSubmitting,
  submissionError,
  needType = 'COMPANY',
  serviceIds = [],
  state = '',
  municipality = '',
  requestedDate = '',
  onChange,
  onSubmit,
  onBack,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!contactName.trim()) {
      errs.contactName = 'Ingresa tu nombre completo.';
    }
    if (!phone.trim()) {
      errs.phone = 'Ingresa un número telefónico de contacto.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      onSubmit();
    }
  };

  const selectedServiceNames = serviceIds
    .map((code) => MIRA_SERVICES.find((s) => s.code === code)?.name || code)
    .filter(Boolean);

  const locationSummary = [municipality, state].filter(Boolean).join(', ');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 select-none" noValidate>
      {/* 1. Área central desplazable */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-3">
        <div>
          <small className="text-[#63A135] dark:text-[#A8D24F] text-[11px] font-bold tracking-[0.15em] uppercase block">
            PASO 4 DE 4
          </small>
          <h3 className="font-serif text-[26px] font-normal text-[#102A35] dark:text-white leading-tight my-1">
            ¿A quién enviamos la propuesta?
          </h3>
          <p className="text-[13px] text-[#738083] dark:text-[#94A3B8]">
            Ingresa tus datos para generar tu folio formal y dar seguimiento continuo.
          </p>
        </div>

        {/* Nombre y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quoteContactName"
              className={funnelFormStyles.label}
            >
              Nombre completo *
            </label>
            <input
              type="text"
              id="quoteContactName"
              name="contactName"
              value={contactName}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ contactName: val });
                if (val.trim()) {
                  setErrors((prev) => ({ ...prev, contactName: '' }));
                }
              }}
              placeholder="Tu nombre y apellido"
              autoComplete="name"
              className={`${funnelFormStyles.inputBase} ${
                errors.contactName ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            />
            {errors.contactName && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.contactName}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteContactPhone"
              className={funnelFormStyles.label}
            >
              Teléfono de contacto *
            </label>
            <input
              type="tel"
              id="quoteContactPhone"
              name="phone"
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ phone: val });
                if (val.trim()) {
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
              placeholder="10 dígitos (ej. 722 123 4567)"
              autoComplete="tel"
              className={`${funnelFormStyles.inputBase} ${
                errors.phone ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            />
            {errors.phone && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.phone}
              </span>
            )}
          </div>
        </div>

        {/* Empresa y Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quoteContactCompany"
              className={funnelFormStyles.label}
            >
              Empresa o Razón Social
            </label>
            <input
              type="text"
              id="quoteContactCompany"
              name="company"
              value={company}
              onChange={(e) => onChange({ company: e.target.value })}
              placeholder="Nombre de la empresa (opcional)"
              autoComplete="organization"
              className={`${funnelFormStyles.inputBase} ${funnelFormStyles.inputNormal}`}
            />
          </div>

          <div>
            <label
              htmlFor="quoteContactEmail"
              className={funnelFormStyles.label}
            >
              Correo electrónico *
            </label>
            <input
              type="email"
              id="quoteContactEmail"
              name="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ email: val });
                if (val.trim()) {
                  setErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              placeholder="correo@empresa.com"
              autoComplete="email"
              className={`${funnelFormStyles.inputBase} ${
                errors.email ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            />
            {errors.email && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.email}
              </span>
            )}
          </div>
        </div>

        {/* Resumen ejecutivo de la solicitud con datos reales */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#08212D] rounded-md border border-[#DFE4DF] dark:border-[#1E4555] space-y-1.5 my-1">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E4555] pb-1">
            <span className="text-[11.5px] font-bold text-[#102A35] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#79BD43]" />
              Resumen de solicitud
            </span>
            <span className="text-[10px] font-bold text-[#79BD43] dark:text-[#A8D24F] bg-[#EEF7E9] dark:bg-[#123825] px-2 py-0.5 rounded-full">
              {SPACE_LABELS[needType] || needType}
            </span>
          </div>

          <div className={`grid ${requestedDate ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-2 text-[#56696D] dark:text-[#94A3B8]`}>
            <div>
              <b className="text-[10.5px] font-bold text-[#102A35] dark:text-slate-200 uppercase tracking-wider block">
                Servicios ({selectedServiceNames.length}):
              </b>
              <span className="text-[11px] truncate block text-[#56696D] dark:text-[#94A3B8]">
                {selectedServiceNames.length > 0
                  ? selectedServiceNames.slice(0, 3).join(', ') + (selectedServiceNames.length > 3 ? ` +${selectedServiceNames.length - 3}` : '')
                  : 'Ninguno seleccionado'}
              </span>
            </div>
            <div>
              <b className="text-[10.5px] font-bold text-[#102A35] dark:text-slate-200 uppercase tracking-wider block">Ubicación estimada:</b>
              <span className="text-[11px] truncate block text-[#56696D] dark:text-[#94A3B8]">
                {locationSummary || 'Por definir'}
              </span>
            </div>
            {requestedDate && (
              <div>
                <b className="text-[10.5px] font-bold text-[#102A35] dark:text-slate-200 uppercase tracking-wider block">Fecha estimada:</b>
                <span className="text-[11px] truncate block text-[#56696D] dark:text-[#94A3B8]">
                  {requestedDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Banner de error si la API responde con fallo */}
        {submissionError && (
          <div
            id="quoteSubmissionError"
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium"
          >
            <span id="quoteSubmissionErrorMsg">{submissionError}</span>
          </div>
        )}
      </div>

      {/* 2. Footer inferior fijo */}
      <div className="flex-none pt-3 mt-3 border-t border-[#DFE4DF] dark:border-[#1E4555] bg-white dark:bg-[#0B2836] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-[13px] font-bold text-[#657275] hover:text-[#102A35] dark:text-[#94A3B8] dark:hover:text-white bg-transparent border-0 cursor-pointer p-0 transition-colors disabled:opacity-50"
        >
          ← Atrás
        </button>

        <button
          type="submit"
          id="btnSubmitQuote"
          disabled={isSubmitting}
          className="bg-[#79BD43] hover:bg-[#66A334] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Enviando...</span>
            </span>
          ) : (
            <>
              <span>Enviar solicitud</span>
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
