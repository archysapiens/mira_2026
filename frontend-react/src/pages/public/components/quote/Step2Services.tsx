import React, { useState, useMemo } from 'react';
import { MIRA_SERVICES, type CatalogService } from '../../../../data/servicesCatalog';

interface Step2ServicesProps {
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'construccion', label: 'Construcción' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'residencial', label: 'Residencial' },
  { id: 'sanidad', label: 'Sanidad' },
];

export const Step2Services: React.FC<Step2ServicesProps> = ({
  selectedServiceIds,
  onChange,
  onNext,
  onBack,
}) => {
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MIRA_SERVICES.filter((service: CatalogService) => {
      const matchesCategory =
        currentCategory === 'all' ||
        service.category === currentCategory ||
        (service.categories && service.categories.includes(currentCategory));

      const matchesSearch =
        query === '' ||
        service.name.toLowerCase().includes(query) ||
        service.categoryLabel.toLowerCase().includes(query) ||
        service.code.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [currentCategory, searchQuery]);

  const toggleService = (code: string) => {
    if (selectedServiceIds.includes(code)) {
      onChange(selectedServiceIds.filter((id) => id !== code));
    } else {
      onChange([...selectedServiceIds, code]);
    }
  };

  const count = selectedServiceIds.length;

  return (
    <div className="space-y-6">
      <div>
        <small className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
          PASO 2 DE 4
        </small>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1">
          Selecciona los servicios que necesitas
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-1">
          Puedes elegir uno o varios servicios según el alcance de tu proyecto.
        </p>
      </div>

      {/* Barra de búsqueda y chips de filtro */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar servicio (ej. silos, pintura, fumigación)..."
            aria-label="Buscar servicio"
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chips de categorías */}
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setCurrentCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#062D3A] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#56696D] hover:bg-[#E2E8F0]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de servicios */}
      {filteredServices.length === 0 ? (
        <div className="p-8 text-center bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
          <p className="text-xs sm:text-sm text-[#56696D]">
            No se encontraron servicios que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1"
          role="group"
          aria-label="Servicios disponibles"
        >
          {filteredServices.map((service) => {
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
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 text-left ${
                  isSelected
                    ? 'border-[#7AC143] bg-[#EEF7E6] shadow-xs'
                    : 'border-[#E8ECEF] bg-white hover:border-[#7AC143]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-[#7AC143] uppercase">
                    {service.categoryLabel}
                  </span>
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-[#7AC143] text-white'
                        : 'border border-[#CBD5E1] text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#062D3A] leading-snug">
                  {service.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botones de navegación del funnel */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer"
        >
          ← Volver
        </button>

        <div className="flex items-center gap-3">
          <span
            id="selectedServicesCounter"
            className="text-xs font-semibold text-[#56696D]"
          >
            {count === 0
              ? '0 seleccionados'
              : count === 1
              ? '1 servicio seleccionado'
              : `${count} servicios seleccionados`}
          </span>

          <button
            type="button"
            id="btnContinueServices"
            disabled={count === 0}
            onClick={onNext}
            className={`inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs ${
              count === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#7AC143] hover:bg-[#68A635] text-white'
            }`}
          >
            <span>Continuar a Proyecto</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
