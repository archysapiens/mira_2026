import React from 'react';

interface DocumentsViewProps {
  onGoToRequests: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onGoToRequests }) => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-white border border-[#E8ECEF] rounded-2xl p-8 md:p-12 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl">
          📂
        </div>
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
          Próximamente disponible
        </span>
        <h2 className="text-2xl font-black text-[#062D3A]">
          Documentos y Comprobantes
        </h2>
        <p className="text-xs md:text-sm text-[#56696D] max-w-md mx-auto leading-relaxed">
          Aquí podrás consultar y descargar tus reportes fotográficos de servicio, cotizaciones formalizadas, actas de entrega y comprobantes técnicos emitidos por MIRA Soluciones Integrales.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onGoToRequests}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Ir a Mis solicitudes →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
