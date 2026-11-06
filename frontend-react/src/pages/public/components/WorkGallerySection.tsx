import React from 'react';

interface WorkGallerySectionProps {
  onImageClick: (src: string, caption: string) => void;
}

const GALLERY_ITEMS = [
  {
    className: 'photo-1',
    src: '/gallery/seguridad.jpg',
    hiresSrc: '/gallery/seguridad.jpg',
    alt: 'Seguridad',
    title: 'Seguridad',
    desc: 'Nuestros trabajadores laboran con un alto grado de seguridad.',
  },
  {
    className: 'photo-2',
    src: '/gallery/empresas.jpg',
    hiresSrc: '/gallery/empresas.jpg',
    alt: 'Cobertura nacional',
    title: 'Cobertura nacional',
    desc: 'Servicios para empresas reconocidas en todo México.',
  },
  {
    className: 'photo-3',
    src: '/gallery/equipo.jpg',
    hiresSrc: '/gallery/equipo.jpg',
    alt: 'Trabajo en equipo',
    title: 'Trabajo en equipo',
    desc: 'Actividades ejecutadas por equipos bien estructurados.',
  },
  {
    className: 'photo-4',
    src: '/gallery/pintura.jpg',
    hiresSrc: '/gallery/pintura.jpg',
    alt: 'Pintura profesional',
    title: 'Pintura profesional',
    desc: 'Aplicadores de sistemas epóxicos.',
  },
  {
    className: 'photo-5',
    src: '/gallery/techos.jpg',
    hiresSrc: '/gallery/techos.jpg',
    alt: 'Limpieza de techos',
    title: 'Limpieza de techos',
    desc: 'Limpieza industrial especializada.',
  },
  {
    className: 'photo-6',
    src: '/gallery/fumigacion.jpg',
    hiresSrc: '/gallery/fumigacion.jpg',
    alt: 'Fumigación sanitaria',
    title: 'Fumigación sanitaria',
    desc: 'Atención de interiores y áreas de almacenamiento.',
  },
];

export const WorkGallerySection: React.FC<WorkGallerySectionProps> = ({ onImageClick }) => {
  return (
    <section className="workGallery">
      <div className="sectionHead">
        <div>
          <p className="eyebrow dark">Así trabajamos</p>
          <h2>Experiencia en campo</h2>
        </div>
        <p>Selecciona una imagen para ampliarla.</p>
      </div>
      <div className="photoMosaic">
        {GALLERY_ITEMS.map((item) => (
          <button
            key={item.className}
            type="button"
            className={item.className}
            onClick={() => onImageClick(item.hiresSrc || item.src, item.title)}
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.dataset.fallbackTried) return;
                target.dataset.fallbackTried = 'true';
                if (target.src.endsWith('.jpg')) {
                  target.src = target.src.replace(/\.jpg$/, '.png');
                } else if (target.src.endsWith('.png')) {
                  target.src = target.src.replace(/\.png$/, '.jpg');
                }
              }}
            />
            <span>
              <b>{item.title}</b>
              <small>{item.desc}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
