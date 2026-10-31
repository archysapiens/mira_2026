import React, { useState } from 'react';

interface Step4ContactInfoProps {
  contactName: string;
  phone: string;
  company: string;
  email: string;
  isSubmitting: boolean;
  submissionError: string | null;
  onChange: (fields: Partial<{
    contactName: string;
    phone: string;
    company: string;
    email: string;
  }>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const Step4ContactInfo: React.FC<Step4ContactInfoProps> = ({
  contactName,
  phone,
  company,
  email,
  isSubmitting,
  submissionError,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <small className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
          PASO 4 DE 4
        </small>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1">
          ¿A quién enviamos la propuesta?
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-1">
          Ingresa tus datos para generar tu folio formal y dar seguimiento continuo.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nombre y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quoteContactName"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
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
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.contactName ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
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
              htmlFor="quoteContactPhone"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
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
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.phone ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.phone && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.phone}
              </span>
            )}
          </div>
        </div>

        {/* Empresa y Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quoteContactCompany"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="quoteContactEmail"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
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
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.email ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.email && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.email}
              </span>
            )}
          </div>
        </div>

        {/* Caja de resumen */}
        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-1">
          <b className="text-[#062D3A] block">Resumen de solicitud:</b>
          <span className="text-[#56696D] block">
            Tu proyecto será registrado de inmediato en el sistema central de MIRA.
          </span>
          <small className="text-slate-400 block">
            Recibirás un folio único para rastreo, consulta de estatus y atención telefónica directa.
          </small>
        </div>

        {/* Mensaje de error de la API si existiese */}
        {submissionError && (
          <div
            id="quoteSubmissionError"
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium"
          >
            <span id="quoteSubmissionErrorMsg">{submissionError}</span>
          </div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer disabled:opacity-50"
        >
          ← Volver a Proyecto
        </button>

        <button
          type="submit"
          id="btnSubmitQuote"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Enviando solicitud...</span>
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

