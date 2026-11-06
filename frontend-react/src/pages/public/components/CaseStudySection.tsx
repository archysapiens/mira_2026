import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

export const CaseStudySection: React.FC = () => {
  const { openQuote } = useQuoteModal();

  return (
    <section className="caseStudy">
      <div className="caseImage">
        <img src="/portfolio/1.jpg" alt="Mantenimiento especializado de silos" loading="lazy" />
        <span>Proyecto industrial</span>
      </div>
      <div className="caseCopy">
        <p className="eyebrow dark">Capacidad comprobable</p>
        <h2>Entramos donde la operación exige experiencia.</h2>
        <p>
          Desde limpieza y mantenimiento de silos hasta recubrimientos, sanidad y estructuras:
          integramos el equipo necesario para intervenir espacios técnicos sin improvisar.
        </p>
        <div className="caseMetrics">
          <span>
            <b>Integral</b>un responsable, varias especialidades
          </span>
          <span>
            <b>Documentado</b>solicitud y seguimiento por folio
          </span>
        </div>
        <button
          type="button"
          id="btnCaseStudyQuote"
          onClick={() => openQuote()}
          className="cursor-pointer"
        >
          Solicitar diagnóstico →
        </button>
      </div>
    </section>
  );
};
