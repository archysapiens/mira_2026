import React, { useMemo } from 'react';
import { MIRA_SERVICES, type CatalogService } from '../../../../data/servicesCatalog';
import type { NeedType } from '../../../../types';

interface Step2ServicesProps {
  spaceType: NeedType;
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_BY_SPACE: Record<NeedType, string[]> = {
  COMPANY: ['SILOS_CLEAN', 'SANITY_TECH', 'METAL_STRUCT', 'HOTEL_SERV', 'RESID_SERV', 'DRYWALL'],
  HOTEL: ['HOTEL_SERV', 'PEST_CTRL', 'CISTERN_CLEAN', 'PAINTING', 'ALUM_GLASS', 'DRYWALL'],
  RESIDENCE: ['RESID_SERV', 'PAINTING', 'PEST_CTRL', 'CISTERN_CLEAN', 'ALUM_GLASS', 'DRYWALL'],
  OTHER: ['SILOS_CLEAN', 'SANITY_TECH', 'METAL_STRUCT', 'HOTEL_SERV', 'RESID_SERV', 'DRYWALL'],
};

// Generador de iconos vectoriales idénticos al prototipo visual original
const renderServiceIcon = (iconName: string, serviceCode?: string) => {
  // 1. Silos (INDUSTRIAL): Punto circular verde sólido original
  if (serviceCode === 'SILOS_CLEAN' || iconName === 'silo') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
      </svg>
    );
  }

  // 2. Sanidad y Limpieza Técnica (INDUSTRIAL): Estrella diamante de 4 puntas ✦
  if (serviceCode === 'SANITY_TECH' || iconName === 'sparkles') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.5 C12 7.7 7.7 12 2.5 12 C7.7 12 12 16.3 12 21.5 C12 16.3 16.3 12 21.5 12 C16.3 12 12 7.7 12 2.5 Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  // 3. Estructuras Metálicas (CONSTRUCCIÓN): Silueta minimalista de nave industrial con techo a dos aguas
  if (serviceCode === 'METAL_STRUCT' || iconName === 'warehouse') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10.5 L12 4.5 L20 10.5 V19.5 H4 Z" />
      </svg>
    );
  }

  // 4. Hoteles (COMERCIAL): Cuadrícula 3x3 de pequeños cuadrados alineados
  if (serviceCode === 'HOTEL_SERV' || iconName === 'building') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g fill="currentColor">
          <rect x="4.5" y="4.5" width="3.5" height="3.5" rx="0.5" />
          <rect x="10.25" y="4.5" width="3.5" height="3.5" rx="0.5" />
          <rect x="16" y="4.5" width="3.5" height="3.5" rx="0.5" />
          <rect x="4.5" y="10.25" width="3.5" height="3.5" rx="0.5" />
          <rect x="10.25" y="10.25" width="3.5" height="3.5" rx="0.5" />
          <rect x="16" y="10.25" width="3.5" height="3.5" rx="0.5" />
          <rect x="4.5" y="16" width="3.5" height="3.5" rx="0.5" />
          <rect x="10.25" y="16" width="3.5" height="3.5" rx="0.5" />
          <rect x="16" y="16" width="3.5" height="3.5" rx="0.5" />
        </g>
      </svg>
    );
  }

  // 5. Residencial (RESIDENCIAL): Dos ondas sinusoidales paralelas horizontales
  if (serviceCode === 'RESID_SERV' || iconName === 'home' || iconName === 'waves') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5c2.5-2 5.5-2 8 0s5.5 2 8 0" />
        <path d="M4 14.5c2.5-2 5.5-2 8 0s5.5 2 8 0" />
      </svg>
    );
  }

  // 6. Tablaroca y Acabados (CONSTRUCCIÓN): Panel rectangular con tres líneas horizontales interiores
  if (serviceCode === 'DRYWALL' || iconName === 'layers' || iconName === 'drywall') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4.5" y="4" width="15" height="16" rx="2" />
        <line x1="8" y1="8.5" x2="16" y2="8.5" strokeWidth="1.6" />
        <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.6" />
        <line x1="8" y1="15.5" x2="16" y2="15.5" strokeWidth="1.6" />
      </svg>
    );
  }

  // Pintura y recubrimientos (CONSTRUCCIÓN): Brocha
  if (serviceCode === 'PAINTING' || iconName === 'brush' || iconName === 'painting') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 8c.5-3 1-5 4-7" />
      </svg>
    );
  }

  // Fumigación y Plagas (SANIDAD): Escudo de protección
  if (serviceCode === 'PEST_CTRL' || iconName === 'shield' || iconName === 'pest') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  // Techos y cubiertas (INDUSTRIAL): Techo/paraguas
  if (serviceCode === 'ROOF_MAINT' || iconName === 'umbrella' || iconName === 'roof') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />
      </svg>
    );
  }

  // Cisternas (SANIDAD): Gota
  if (serviceCode === 'CISTERN_CLEAN' || iconName === 'droplet' || iconName === 'cistern') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }

  // Aluminio y cristales (CONSTRUCCIÓN): Cancelería
  if (serviceCode === 'ALUM_GLASS' || iconName === 'grid' || iconName === 'alum') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }

  // Carpintería y herrería (CONSTRUCCIÓN): Herramienta
  if (serviceCode === 'CARP_IRON' || iconName === 'tool' || iconName === 'carp') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }

  // DRO y Planos (INGENIERÍA): Brújula/compás
  if (serviceCode === 'DRO_PLANS' || iconName === 'compass' || iconName === 'dro') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
      </svg>
    );
  }

  // Capacitación y seguridad (INDUSTRIAL): Distintivo
  if (serviceCode === 'SAFETY_TRAIN' || iconName === 'award' || iconName === 'safety') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    );
  }

  // Epóxicos FDA (INDUSTRIAL): Escudo con verificación
  if (serviceCode === 'EPOXY_COAT' || iconName === 'shield-check' || iconName === 'epoxy') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
};

export const Step2Services: React.FC<Step2ServicesProps> = ({
  spaceType,
  selectedServiceIds,
  onChange,
  onNext,
  onBack,
}) => {
  // Lista unificada con TODOS los 15 servicios del catálogo MIRA en una única pantalla
  // Se da prioridad a los servicios más relevantes para la necesidad seleccionada
  const allServices = useMemo(() => {
    const suggestedCodes = SUGGESTED_BY_SPACE[spaceType] || SUGGESTED_BY_SPACE.COMPANY;
    const prioritized: CatalogService[] = [];
    const remaining: CatalogService[] = [];

    suggestedCodes.forEach((code) => {
      const service = MIRA_SERVICES.find((s) => s.code === code);
      if (service && !prioritized.some((p) => p.code === service.code)) {
        prioritized.push(service);
      }
    });

    MIRA_SERVICES.forEach((service) => {
      if (!prioritized.some((p) => p.code === service.code)) {
        remaining.push(service);
      }
    });

    return [...prioritized, ...remaining];
  }, [spaceType]);

  const toggleService = (code: string) => {
    if (selectedServiceIds.includes(code)) {
      onChange(selectedServiceIds.filter((id) => id !== code));
    } else {
      onChange([...selectedServiceIds, code]);
    }
  };

  const count = selectedServiceIds.length;

  return (
    <div className="flex flex-col h-full min-h-0 select-none">
      {/* 1. Área central de contenido (con scroll propio vertical en el extremo derecho) */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        <div className="mb-3.5">
          <small className="text-[#63A135] dark:text-[#A8D24F] text-[11px] font-bold tracking-[0.15em] uppercase block">
            PASO 2 DE 4
          </small>
          <h3 className="font-serif text-[26px] font-normal text-[#102A35] dark:text-white leading-tight my-1">
            Selecciona los servicios que necesitas
          </h3>
          <p className="text-[13px] text-[#738083] dark:text-[#94A3B8]">
            Puedes elegir uno o varios.
          </p>
        </div>

        {/* Cuadrícula unificada de todos los 15 servicios en 2 columnas EXACTAS al prototipo */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2"
          role="group"
          aria-label="Servicios disponibles"
        >
          {allServices.map((service) => {
            const isSelected = selectedServiceIds.includes(service.code);
            return (
              <div
                key={service.code}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => toggleService(service.code)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleService(service.code);
                  }
                }}
                className={`border rounded-md px-3.5 py-2.5 flex items-center gap-3 transition-all cursor-pointer select-none min-h-[58px] ${
                  isSelected
                    ? 'border-2 border-[#79BD43] bg-[#F5FAEF] dark:bg-[#123825]/40 dark:border-[#79BD43]'
                    : 'border-[#DFE4DF] bg-white hover:border-[#79BD43] hover:bg-[#F7FAF5] dark:bg-[#071C25] dark:border-[#1E4555] dark:hover:border-[#79BD43] dark:hover:bg-[#0F2F3E]'
                }`}
              >
                <div className="w-[34px] h-[34px] rounded-full bg-[#EEF6E9] text-[#659C43] dark:bg-[#123825] dark:text-[#A8D24F] flex items-center justify-center shrink-0">
                  {renderServiceIcon(service.icon || service.code, service.code)}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <b className="text-[12.5px] font-bold text-[#102A35] dark:text-white leading-snug line-clamp-2 block">
                    {service.name}
                  </b>
                  <small className="text-[9.5px] font-bold text-[#8B9796] dark:text-[#94A3B8] uppercase tracking-wider block mt-0.5">
                    {service.categoryLabel}
                  </small>
                </div>

                <div className="w-5 flex items-center justify-end shrink-0">
                  {isSelected && (
                    <span className="text-[#79BD43] dark:text-[#A8D24F] font-bold text-sm leading-none">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Footer inferior fijo con posición exacta: Atrás (izq), Contador (centro), Continuar (der) */}
      <div className="flex-none pt-3 mt-3 border-t border-[#DFE4DF] dark:border-[#1E4555] bg-white dark:bg-[#0B2836] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] font-bold text-[#657275] hover:text-[#102A35] dark:text-[#94A3B8] dark:hover:text-white bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          ← Atrás
        </button>

        <span
          id="selectedServicesCounter"
          className="text-[12px] font-medium text-[#738083] dark:text-[#94A3B8]"
        >
          {count === 0
            ? '0 seleccionados'
            : count === 1
            ? '1 servicio seleccionado'
            : `${count} seleccionados`}
        </span>

        <button
          type="button"
          id="btnContinueServices"
          disabled={count === 0}
          onClick={onNext}
          aria-label={
            count === 1
              ? 'Continuar con 1 servicio'
              : count > 1
              ? `Continuar con ${count} servicios`
              : 'Continuar'
          }
          className={`text-white text-[13px] font-bold px-7 py-2.5 rounded transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5 ${
            count === 0
              ? 'bg-[#79BD43]/40 cursor-not-allowed opacity-40 shadow-none'
              : 'bg-[#79BD43] hover:bg-[#66A334]'
          }`}
        >
          <span>Continuar</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
