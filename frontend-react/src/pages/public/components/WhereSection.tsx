import React from 'react';

export const WhereSection: React.FC = () => {
  return (
    <section className="where" id="donde">
      <div>
        <p className="eyebrow">¿Dónde trabajamos?</p>
        <h2>Soluciones para cada entorno</h2>
      </div>
      <div className="whereList">
        <span>✓ Oficinas</span>
        <span>✓ Condominios</span>
        <span>✓ Escuelas</span>
        <span>✓ Restaurantes</span>
        <span>✓ Centros comerciales</span>
        <span>✓ Industria alimentaria</span>
      </div>
    </section>
  );
};
