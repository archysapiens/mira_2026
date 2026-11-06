import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const MobileSalesBar: React.FC = () => {
  const { openQuote, isOpen } = useQuoteModal();

  // Ocultar si el modal de cotización está activo
  if (isOpen) return null;

  return (
    <div className="mobileSalesBar">
      <div>
        <small>¿Tienes un proyecto?</small>
        <b>Recibe una propuesta</b>
      </div>
      <button
        type="button"
        id="btnMobileSalesQuote"
        onClick={() => openQuote()}
        className="cursor-pointer"
      >
        Cotizar →
      </button>
    </div>
  );
};
