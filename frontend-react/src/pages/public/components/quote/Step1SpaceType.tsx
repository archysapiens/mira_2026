import React from 'react';
import type { NeedType } from '../../../../types';

interface Step1SpaceTypeProps {
  value: NeedType;
  onChange: (value: NeedType) => void;
  onNext: () => void;
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
}) => {
  return (
    <div className="space-y-6">
      <div>
        <small className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
          PASO 1 DE 4
        </small>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1">
          ¿Qué tipo de espacio requiere atención?
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-1">
          Selecciona el contexto donde se realizarán las actividades.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {SPACE_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <label
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                isSelected
                  ? 'border-[#7AC143] bg-[#EEF7E6] shadow-xs'
                  : 'border-[#E8ECEF] bg-white hover:border-[#7AC143]/50'
              }`}
            >
              <input
                type="radio"
                name="needType"
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange(opt.id)}
                className="sr-only"
              />
              <span className="w-10 h-10 rounded-lg bg-[#062D3A] text-white flex items-center justify-center text-lg shrink-0">
                {opt.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#062D3A] leading-snug">
                  {opt.title}
                </div>
                <div className="text-[11px] text-[#56696D] leading-tight mt-0.5">
                  {opt.desc}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <span>Continuar a Servicios</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};

