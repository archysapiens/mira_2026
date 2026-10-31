import React from 'react';

export const FunnelBanner: React.FC = () => {
  return (
    <section className="funnelBanner">
      <div>
        <p className="eyebrow">Solicitud guiada</p>
        <h2>Tu proyecto empieza aquí.</h2>
        <p>Selecciona lo que necesitas y recibe atención de un especialista.</p>
      </div>
      <a href="#cotizar" style={{ textDecoration: 'none' }}>
        <button type="button">
          Comenzar cotización <span>→</span>
        </button>
      </a>
    </section>
  );
};
