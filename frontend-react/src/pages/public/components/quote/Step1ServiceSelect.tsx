import React, { useState, useEffect } from 'react';
import {
  SERVICE_PILLARS,
  getServicesForPillar,
  findPillarForService,
} from '../../../../data/servicePillars';
import { type CatalogService } from '../../../../data/servicesCatalog';

interface Step1ServiceSelectProps {
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  onNext: () => void;
  initialServiceCode?: string | null;
}

export const Step1ServiceSelect: React.FC<Step1ServiceSelectProps> = ({
  selectedServiceIds,
  onChange,
  onNext,
  initialServiceCode,
}) => {
  // Pilar activo (por defecto abre el primero o el que contenga el servicio preseleccionado)
  const [activePillarId, setActivePillarId] = useState<string>(() => {
    if (initialServiceCode) {
      const p = findPillarForService(initialServiceCode);
      if (p) return p.id;
    }
    if (selectedServiceIds.length > 0) {
      const p = findPillarForService(selectedServiceIds[0]);
      if (p) return p.id;
    }
    return 'industrial';
  });

  const [isCustomNeed, setIsCustomNeed] = useState<boolean>(false);

  useEffect(() => {
    if (initialServiceCode) {
      const p = findPillarForService(initialServiceCode);
      if (p) setActivePillarId(p.id);
    }
  }, [initialServiceCode]);

  const activePillar = SERVICE_PILLARS.find((p) => p.id === activePillarId) || SERVICE_PILLARS[0];
  const servicesInPillar = getServicesForPillar(activePillar.id);

  const handleSelectPillar = (pillarId: string) => {
    setActivePillarId(pillarId);
    setIsCustomNeed(false);
  };

  const handleToggleService = (serviceCode: string, autoAdvance = true) => {
    setIsCustomNeed(false);
    const isAlreadySelected = selectedServiceIds.includes(serviceCode);
    let newSelection: string[];

    if (isAlreadySelected) {
      newSelection = selectedServiceIds.filter((id) => id !== serviceCode);
    } else {
      newSelection = [...selectedServiceIds, serviceCode];
    }

    onChange(newSelection);

    // Si es selección única de un servicio y autoAdvance está activo, avanzar de inmediato
    if (!isAlreadySelected && autoAdvance && selectedServiceIds.length === 0) {
      onNext();
    }
  };

  const handleSelectCustom = () => {
    setIsCustomNeed(true);
    onChange(['OTHER_SPECIAL']);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del paso */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-[#EEF7E6] text-[#2D6619] border border-[#C8E6B2]">
            ETAPA 1 DE 4 · ESPECIALIDADES
          </span>
          <span className="text-xs text-[#56696D]">Catálogo industrial estructurado</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1.5">
          ¿Qué servicio requiere tu proyecto?
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-0.5">
          Explora los pilares de servicio MIRA o selecciona directamente la especialidad técnica.
        </p>
      </div>

      {/* 1. Selector de Pilares Principales */}
      <div
        role="tablist"
        aria-label="Pilares de especialidad industrial"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5"
      >
        {SERVICE_PILLARS.map((pillar) => {
          const isPillarActive = pillar.id === activePillarId;
          const hasSelectedInPillar = getServicesForPillar(pillar.id).some((s) =>
            selectedServiceIds.includes(s.code)
          );

          return (
            <button
              key={pillar.id}
              type="button"
              role="tab"
              aria-selected={isPillarActive}
              onClick={() => handleSelectPillar(pillar.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isPillarActive
                  ? 'border-[#7AC143] bg-[#062D3A] text-white shadow-md'
                  : hasSelectedInPillar
                  ? 'border-[#7AC143] bg-[#EEF7E6] text-[#062D3A]'
                  : 'border-[#DCE2DD] bg-white hover:border-[#7AC143]/60 text-[#062D3A]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{pillar.icon}</span>
                {hasSelectedInPillar && (
                  <span className="w-2 h-2 rounded-full bg-[#7AC143] ring-2 ring-white" />
                )}
              </div>
              <div>
                <div
                  className={`text-xs font-bold leading-tight ${
                    isPillarActive ? 'text-white' : 'text-[#062D3A]'
                  }`}
                >
                  {pillar.shortTitle}
                </div>
                <div
                  className={`text-[10px] mt-0.5 truncate ${
                    isPillarActive ? 'text-slate-300' : 'text-[#56696D]'
                  }`}
                >
                  {pillar.badge}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Lista Progresiva de Servicios bajo el Pilar Activo */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-[#062D3A] flex items-center gap-2">
              <span>{activePillar.icon}</span>
              <span>{activePillar.title}</span>
            </h4>
            <p className="text-xs text-[#56696D] mt-0.5">{activePillar.subtitle}</p>
          </div>
          <span className="text-[11px] font-semibold text-[#56696D] self-start sm:self-auto">
            {selectedServiceIds.length > 0
              ? `${selectedServiceIds.length} servicio(s) marcado(s)`
              : 'Selecciona una o más opciones'}
          </span>
        </div>

        {/* Tarjetas de servicios dentro del pilar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {servicesInPillar.map((service: CatalogService) => {
            const isSelected = selectedServiceIds.includes(service.code);

            return (
              <div
                key={service.code}
                role="button"
                tabIndex={0}
                data-testid={`service-card-${service.code}`}
                aria-label={service.name}
                onClick={() => handleToggleService(service.code, true)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggleService(service.code, true);
                  }
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isSelected
                    ? 'border-[#7AC143] bg-white shadow-xs'
                    : 'border-white bg-white hover:border-[#7AC143]/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  aria-label={service.name}
                  className="mt-1 w-4 h-4 rounded text-[#7AC143] focus:ring-[#7AC143] border-slate-300 cursor-pointer pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-[#062D3A] leading-snug">
                    {service.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {service.categoryLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {service.code}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Opción alternativa "No encuentro mi servicio" */}
        <div className="pt-2 text-center">
          <button
            type="button"
            id="btnCustomNeed"
            onClick={handleSelectCustom}
            className={`text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCustomNeed ? 'text-[#7AC143] underline' : 'text-[#56696D] hover:text-[#062D3A]'
            }`}
          >
            <span>✦ ¿No encuentras tu servicio específico?</span>
            <span className="text-[#7AC143] font-bold">Solicitar asesoría técnica directa →</span>
          </button>
        </div>
      </div>

      {/* Botón de continuación si se seleccionaron múltiples servicios o para avanzar manual */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[#56696D]">
          {selectedServiceIds.length === 0 ? (
            'Al hacer clic en un servicio avanzarás automáticamente.'
          ) : (
            <span>
              Seleccionaste: <strong>{selectedServiceIds.length}</strong> servicio(s)
            </span>
          )}
        </span>

        <button
          type="button"
          id="btnNextToStep2"
          onClick={onNext}
          disabled={selectedServiceIds.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continuar a Detalles</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
