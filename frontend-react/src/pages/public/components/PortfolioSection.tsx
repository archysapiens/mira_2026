import React from 'react';

interface PortfolioSectionProps {
  onImageClick: (src: string, caption: string) => void;
}

const ITEMS = [
  {
    src: '/portfolio/1.jpg',
    title: 'Limpieza y mantenimiento de silos',
    subtitle: 'Silos metálicos y de concreto.',
  },
  {
    src: '/portfolio/2.jpg',
    title: 'Recubrimientos certificados',
    subtitle: 'Recubrimientos epóxicos de grado alimenticio.',
  },
  {
    src: '/portfolio/3.jpg',
    title: 'Mantenimiento de silos',
    subtitle: 'Mantenimiento integral de equipos e inmuebles.',
  },
  {
    src: '/portfolio/4.jpg',
    title: 'Colocación de silos',
    subtitle: 'Recubrimiento FDA en interiores.',
  },
  {
    src: '/portfolio/5.jpg',
    title: 'Sanidad',
    subtitle: 'Limpieza, sanitización y fumigación integral.',
  },
  {
    src: '/portfolio/6.jpg',
    title: 'Limpieza de cisternas',
    subtitle: 'Sanitizado, repintado y sellado de fisuras.',
  },
  {
    src: '/portfolio/7.jpg',
    title: 'Silos de harina',
    subtitle: 'Limpieza interna y recubrimientos exteriores.',
  },
  {
    src: '/portfolio/8.jpg',
    title: 'Limpieza de techos',
    subtitle: 'Estructuras y exteriores de naves de producción.',
  },
];

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onImageClick }) => {
  return (
    <section className="portfolio" id="portafolio">
      <div className="sectionHead">
        <div>
          <p className="eyebrow">Nuestro trabajo</p>
          <h2>Portafolio</h2>
        </div>
        <p>Proyectos reales realizados por MIRA.</p>
      </div>

      <div className="portfolioGrid">
        {ITEMS.map((item) => (
          <button
            key={item.src}
            type="button"
            onClick={() => onImageClick(item.src, item.title)}
          >
            <img src={item.src} alt={item.title} loading="lazy" />
            <span>
              <b>{item.title}</b>
              <small>{item.subtitle}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
