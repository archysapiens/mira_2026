import React from 'react';
import { Link } from 'react-router-dom';

interface QuoteSuccessScreenProps {
  folio: string;
  email: string;
  onReset: () => void;
}

export const QuoteSuccessScreen: React.FC<QuoteSuccessScreenProps> = ({
  folio,
  email,
  onReset,
}) => {
  return (
    <div
      id="quoteSuccessScreen"
      aria-live="polite"
      className="text-center py-6 sm:py-10 space-y-6"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-[#EEF7E6] text-[#7AC143] flex items-center justify-center text-3xl font-black shadow-inner">
        ✓
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
          Solicitud recibida con éxito
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-[#062D3A] tracking-tight mt-1">
          ¡Hemos registrado tu solicitud!
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] max-w-md mx-auto mt-2">
          Un especialista técnico de MIRA revisará el alcance para preparar tu propuesta formal y contactarte.
        </p>
      </div>

      {/* Recibo del folio */}
      <div className="max-w-md mx-auto p-6 bg-[#F8FAFC] border-2 border-[#7AC143]/30 rounded-2xl shadow-xs space-y-2">
        <small className="text-[10px] font-bold text-[#56696D] tracking-wider uppercase block">
          FOLIO OFICIAL DE SEGUIMIENTO
        </small>
        <strong
          id="confirmationFolio"
          className="text-2xl sm:text-3xl font-black text-[#062D3A] tracking-wide block"
        >
          {folio}
        </strong>
        {folio.startsWith('DEMO-') && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Folio Simulado (Modo Demostración)
          </span>
        )}
        <span className="text-xs text-[#56696D] block">
          Confirmación enviada a: <b id="confirmationEmail" className="text-[#062D3A]">{email}</b>
        </span>
      </div>

      {/* Próximos pasos para el cliente */}
      <div className="max-w-md mx-auto pt-2 space-y-3">
        <p className="text-xs text-[#56696D]">
          ¿Deseas activar tu cuenta para consultar avances y documentos en el portal?
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            id="btnGoToRegister"
            to={`/register?folio=${encodeURIComponent(folio)}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs"
          >
            Registrar contraseña
          </Link>
          <Link
            id="linkGoToLogin"
            to={`/login?folio=${encodeURIComponent(folio)}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#CBD5E1] text-[#062D3A] hover:bg-slate-50 text-xs sm:text-sm font-bold rounded-xl transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          id="btnResetWizard"
          onClick={onReset}
          className="text-xs sm:text-sm font-bold text-[#56696D] hover:text-[#062D3A] underline transition-colors cursor-pointer"
        >
          Nueva cotización
        </button>
      </div>
    </div>
  );
};

