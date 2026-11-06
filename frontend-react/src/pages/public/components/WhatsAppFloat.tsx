import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const WhatsAppFloat: React.FC = () => {
  const { isOpen } = useQuoteModal();

  // Ocultar si el modal de cotización está activo
  if (isOpen) return null;

  return (
    <a
      className="whatsappFloat"
      href="https://wa.me/527222245131?text=Hola%20MIRA%2C%20me%20interesa%20solicitar%20una%20cotizaci%C3%B3n.%0ATipo%20de%20espacio%3A%20Empresa%20%2F%20planta"
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <span>☎</span>
      <b>WhatsApp</b>
    </a>
  );
};
