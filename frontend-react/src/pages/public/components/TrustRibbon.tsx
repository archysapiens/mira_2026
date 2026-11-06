import React from 'react';

export const TrustRibbon: React.FC = () => {
  return (
    <section className="trustRibbon" id="confianza">
      <span>
        <span className="trustCheck" aria-hidden="true">✓</span>
        Una sola coordinación
      </span>
      <span>
        <span className="trustCheck" aria-hidden="true">✓</span>
        Personal especializado
      </span>
      <span>
        <span className="trustCheck" aria-hidden="true">✓</span>
        Seguimiento por folio
      </span>
      <span>
        <span className="trustCheck" aria-hidden="true">✓</span>
        Atención personalizada
      </span>
    </section>
  );
};
