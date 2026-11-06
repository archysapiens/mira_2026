import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface QuoteSuccessScreenProps {
  folio: string;
  email: string;
  onReset: () => void;
  onClose?: () => void;
}

export const QuoteSuccessScreen: React.FC<QuoteSuccessScreenProps> = ({
  folio,
  email,
  onReset,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyFolio = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(folio);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = folio;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('No se pudo copiar el folio al portapapeles:', e);
    }
  };

  return (
    <div
      id="quoteSuccessScreen"
      aria-live="polite"
      className="text-center py-5 space-y-4 max-w-lg mx-auto select-none"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-[#EEF7E9] dark:bg-[#123825] text-[#79BD43] dark:text-[#A8D24F] flex items-center justify-center text-2xl font-bold shadow-inner">
        ✓
      </div>

      <div>
        <p className="text-[11px] font-bold text-[#63A135] dark:text-[#A8D24F] tracking-[0.15em] uppercase">
          Solicitud recibida con éxito
        </p>
        <h3 className="font-serif text-[26px] font-normal text-[#102A35] dark:text-white leading-tight my-1">
          ¡Hemos registrado tu proyecto!
        </h3>
        <p className="text-[13px] text-[#738083] dark:text-[#94A3B8] max-w-md mx-auto">
          Un especialista técnico de MIRA revisará el alcance para preparar tu propuesta formal y contactarte.
        </p>
      </div>

      {/* Tarjeta del folio oficial */}
      <div className="p-4 bg-[#F8FAFC] dark:bg-[#08212D] border border-[#DFE4DF] dark:border-[#1E4555] rounded-md space-y-2">
        <small className="text-[10px] font-bold text-[#8B9796] dark:text-[#94A3B8] tracking-wider uppercase block">
          FOLIO OFICIAL DE SEGUIMIENTO
        </small>
        <div className="flex items-center justify-center gap-2.5">
          <strong
            id="confirmationFolio"
            className="text-2xl font-black text-[#102A35] dark:text-white tracking-wide"
          >
            {folio}
          </strong>
          <button
            type="button"
            id="btnCopyFolio"
            onClick={handleCopyFolio}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-[#79BD43] text-white shadow-xs'
                : 'bg-white dark:bg-[#0B2836] border border-[#CED7D4] dark:border-[#1E4555] text-[#102A35] dark:text-white hover:border-[#79BD43]'
            }`}
          >
            {copied ? '✓ Copiado' : 'Copiar folio'}
          </button>
        </div>
        <p className="text-xs text-[#56696D] dark:text-[#94A3B8]">
          Confirmación enviada a: <b id="confirmationEmail" className="text-[#102A35] dark:text-white">{email}</b>
        </p>
      </div>

      {/* Siguientes pasos */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1E4555] space-y-3">
        <p className="text-xs text-[#738083] dark:text-[#94A3B8]">
          ¿Deseas activar tu cuenta para consultar avances y documentos en el portal?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/register"
            id="btnGoToRegister"
            onClick={onClose}
            className="px-4 py-2 bg-[#79BD43] hover:bg-[#66A334] text-white text-xs font-bold rounded transition-colors"
          >
            Registrar contraseña
          </Link>
          <Link
            to="/login"
            id="linkGoToLogin"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-[#0B2836] border border-[#CED7D4] dark:border-[#1E4555] text-[#102A35] dark:text-white text-xs font-semibold rounded hover:bg-slate-50 dark:hover:bg-[#123E52] transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-center gap-4 text-xs">
        <button
          type="button"
          id="btnResetWizard"
          onClick={onReset}
          className="text-[#579D28] hover:underline font-semibold cursor-pointer"
        >
          Cotizar otro proyecto
        </button>
        {onClose && (
          <button
            type="button"
            id="btnCloseSuccessModal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};
