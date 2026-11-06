import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const PublicFooter: React.FC = () => {
  const { openQuote } = useQuoteModal();

  return (
    <footer id="contacto">
      <div className="brand footerBrand">
        <img
          src="/assets/mir.svg"
          alt="MIRA"
          width={96}
          height={71}
          style={{ width: '96px', height: 'auto', filter: 'brightness(0) invert()' }}
        />
        <span>Soluciones integrales</span>
      </div>

      <p>
        Servicios de mantenimiento, limpieza, sanitización y remodelación con compromiso y calidad.
      </p>

      <div>
        <b>Contacto</b>
        <span>Colombia No. 301-A, Col. Las Américas, C.P. 50130, Toluca, Estado de México</span>
        <a href="tel:8005056270">800 505 62 70</a>
        <a href="mailto:mirasa@prodigy.net.mx">mirasa@prodigy.net.mx</a>
        <button
          type="button"
          id="btnFooterQuote"
          onClick={() => openQuote()}
          className="footerAction cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', font: 'inherit' }}
        >
          Solicitar una cotización
        </button>
      </div>

      <small>© 2026 MIRA. Todos los derechos reservados.</small>
    </footer>
  );
};
