import React, { useRef, useEffect, useState } from 'react';
import type { NeedType } from '../../../../types';
import { funnelFormStyles } from './quoteFormStyles';

interface Step1SpaceTypeProps {
  value: NeedType;
  onChange: (value: NeedType) => void;
  onNext: () => void;
  otherDescription?: string;
  onOtherDescriptionChange?: (desc: string) => void;
}

const SPACE_OPTIONS: { id: NeedType; title: string; desc: string; icon: string }[] = [
  {
    id: 'HOTEL',
    title: 'Hotel / Hospedaje',
    desc: 'Habitaciones, áreas comunes y zonas húmedas',
    icon: '▦',
  },
  {
    id: 'RESIDENCE',
    title: 'Residencial / Condominio',
    desc: 'Viviendas, torres y áreas compartidas',
    icon: '⌁',
  },
  {
    id: 'COMPANY',
    title: 'Empresa / Planta',
    desc: 'Naves, bodegas, silos y oficinas',
    icon: '◉',
  },
  {
    id: 'OTHER',
    title: 'Otro espacio',
    desc: 'Escuelas, clínicas, comercios u obra especial',
    icon: '✦',
  },
];

export const Step1SpaceType: React.FC<Step1SpaceTypeProps> = ({
  value,
  onChange,
  onNext,
  otherDescription = '',
  onOtherDescriptionChange,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localOtherDesc, setLocalOtherDesc] = useState<string>(otherDescription);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleSelect = (id: NeedType) => {
    onChange(id);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Avance automático suave de 320ms SOLO para HOTEL, RESIDENCE y COMPANY
    // Si es OTHER ("Otro espacio"), el usuario debe describir su requerimiento antes de avanzar
    if (id !== 'OTHER') {
      timerRef.current = setTimeout(() => {
        onNext();
      }, 320);
    }
  };

  const handleManualContinue = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onNext();
  };

  return (
    <div className="flex flex-col h-full min-h-0 select-none">
      {/* 1. Área central de contenido (con scroll propio vertical) */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        <div className="mb-4">
          <small className="text-[#63A135] text-[11px] font-bold tracking-[0.15em] uppercase block">
            PASO 1 DE 4
          </small>
          <h3 className="font-serif text-[24px] sm:text-[26px] font-normal text-[#102A35] dark:text-[#F8FAFC] leading-tight my-1">
            ¿Qué tipo de espacio requiere atención?
          </h3>
          <p className="text-xs sm:text-[13px] text-[#738083] dark:text-[#94A3B8]">
            Selecciona el contexto donde se realizarán las actividades.
          </p>
        </div>

        {/* Grid de 2 columnas con las 4 tarjetas originales compactas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPACE_OPTIONS.map((opt) => {
            const isSelected = value === opt.id;
            return (
              <div
                key={opt.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(opt.id);
                  }
                }}
                className={`p-3.5 rounded-md border transition-all cursor-pointer flex items-center gap-3.5 select-none min-h-[72px] sm:min-h-[76px] ${
                  isSelected
                    ? 'border-2 border-[#79BD43] bg-[#F5FAEF] dark:bg-[#0F3822]'
                    : 'border-[#DFE4DF] dark:border-[#1E4555] bg-white dark:bg-[#08212D] hover:border-[#79BD43] hover:bg-[#F7FAF5] dark:hover:bg-[#0D2D3D]'
                }`}
              >
                <div className="w-[40px] h-[40px] rounded-full bg-[#EEF7E9] dark:bg-[#123924] text-[#6B9E4C] dark:text-[#A8D24F] flex items-center justify-center text-lg font-bold shrink-0">
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <b className="text-[14px] font-bold text-[#102A35] dark:text-[#F8FAFC] block mb-0.5 leading-snug">
                    {opt.title}
                  </b>
                  <small className="text-[11.5px] text-[#748486] dark:text-[#94A3B8] leading-tight block">
                    {opt.desc}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campo condicional para especificar requerimiento si seleccionó 'Otro espacio' */}
        {value === 'OTHER' && (
          <div className="mt-4 p-3 bg-[#F8FAFC] dark:bg-[#08212D] rounded-md border border-[#CED7D4] dark:border-[#1E4555] space-y-1.5 animate-fadeIn">
            <label
              htmlFor="quoteOtherDesc"
              className={funnelFormStyles.label}
            >
              Especifica el tipo de espacio o proyecto especial *
            </label>
            <input
              type="text"
              id="quoteOtherDesc"
              value={localOtherDesc}
              onChange={(e) => {
                const val = e.target.value;
                setLocalOtherDesc(val);
                if (onOtherDescriptionChange) {
                  onOtherDescriptionChange(val);
                }
              }}
              placeholder="Ej. Clínica, escuela, centro comercial, parque logístico o nave especial..."
              className={`${funnelFormStyles.inputBase} ${funnelFormStyles.inputNormal}`}
            />
          </div>
        )}
      </div>

      {/* 2. Footer inferior fijo */}
      <div className="flex-none pt-3 mt-3 border-t border-[#DFE4DF] dark:border-[#1A3D4D] bg-white dark:bg-[#0B2836] flex items-center justify-between">
        <span />
        <button
          type="button"
          onClick={handleManualContinue}
          className="bg-[#79BD43] hover:bg-[#66A334] text-white text-[13px] font-bold px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>Continuar a Servicios</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
