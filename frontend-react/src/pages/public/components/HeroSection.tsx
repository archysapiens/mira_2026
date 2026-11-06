import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const HeroSection: React.FC = () => {
  const { openQuote } = useQuoteModal();

  return (
    <section className="hero" id="inicio">
      <div className="heroShade" />
      <div className="heroContent">
        <div className="heroStatus">
          <i /> Especialistas disponibles para nuevos proyectos
        </div>
        <p className="eyebrow">Mantenimiento · limpieza · sanitización · construcción</p>
        <h1>
          Resolvemos lo complejo.
          <br />
          <em>Cuidamos cada detalle.</em>
        </h1>
        <p>
          Un solo equipo para diagnosticar, ejecutar y dar seguimiento a servicios críticos, con
          seguridad, orden y cobertura nacional.
        </p>
        <div className="heroActions">
          <a
            href="#cotizar"
            id="heroQuoteBtn"
            onClick={(e) => {
              e.preventDefault();
              openQuote();
            }}
            className="primary cursor-pointer"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Recibir propuesta <span aria-hidden="true" style={{ marginLeft: '12px' }}>→</span>
          </a>
          <a href="#metodo" className="secondary">
            Conocer el proceso
          </a>
        </div>
        <div className="proof">
          <span>
            <b>+20</b>
            <span>AÑOS DE EXPERIENCIA</span>
          </span>
          <span>
            <b>24/7</b>
            <span>ATENCIÓN A PROYECTOS</span>
          </span>
          <span>
            <b>Nacional</b>
            <span>COBERTURA EN MÉXICO</span>
          </span>
        </div>
      </div>
      <a className="scrollCue" href="#confianza">
        <span>↓</span> Descubre cómo trabajamos
      </a>
    </section>
  );
};
