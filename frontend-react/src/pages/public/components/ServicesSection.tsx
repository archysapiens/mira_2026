import React from 'react';
import { useQuoteModal } from '../../../context/QuoteModalContext';

interface ServicesSectionProps {
  onSelectService?: (serviceCode: string) => void;
}

const SERVICES = [
  {
    code: 'SILOS_CLEAN',
    category: 'Industrial',
    title: 'Limpieza y sanitización de silos',
    desc: 'Servicio especializado para plantas alimentarias.',
    icon: '◉',
  },
  {
    code: 'SANITY_TECH',
    category: 'Industrial',
    title: 'Sanidad y limpieza técnica',
    desc: 'Protocolos profesionales para instalaciones críticas.',
    icon: '✦',
  },
  {
    code: 'METAL_STRUCT',
    category: 'Construcción',
    title: 'Estructuras metálicas y naves',
    desc: 'Fabricación, mantenimiento y adecuación.',
    icon: '⌂',
  },
  {
    code: 'HOTEL_SERV',
    category: 'Comercial',
    title: 'Servicios para hoteles',
    desc: 'Mantenimiento integral de habitaciones y áreas comunes.',
    icon: '▦',
  },
  {
    code: 'DRYWALL',
    category: 'Residencial',
    title: 'Tablaroca y acabados',
    desc: 'Remodelación, muros, plafones y acabados.',
    icon: '⌁',
  },
  {
    code: 'COATINGS',
    category: 'Especial',
    title: 'Recubrimientos industriales',
    desc: 'Pintura epóxica y acabados de alta resistencia.',
    icon: '☵',
  },
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const { openQuote } = useQuoteModal();

  const handleServiceClick = (code: string) => {
    if (onSelectService) {
      onSelectService(code);
    } else {
      openQuote(code);
    }
  };

  return (
    <section className="services" id="servicios">
      <div className="sectionHead">
        <div>
          <p className="eyebrow dark">Catálogo</p>
          <h2>Servicios para cada espacio</h2>
        </div>
        <button
          type="button"
          id="btnSelectServicesSection"
          onClick={() => openQuote()}
          className="textButton cursor-pointer"
        >
          Seleccionar servicios →
        </button>
      </div>

      <div className="serviceGrid">
        {SERVICES.map((s) => (
          <article
            key={s.code}
            role="button"
            tabIndex={0}
            onClick={() => handleServiceClick(s.code)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleServiceClick(s.code);
              }
            }}
          >
            <span className="serviceIcon">{s.icon}</span>
            <small>{s.category}</small>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <b className="cardLink">Cotizar este servicio →</b>
          </article>
        ))}
      </div>
    </section>
  );
};
