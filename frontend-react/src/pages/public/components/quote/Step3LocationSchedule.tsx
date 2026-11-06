import React, { useState, useMemo } from 'react';
import { MEXICO_LOCATIONS } from '../../../../data/mexicoLocations';

interface Step3LocationScheduleProps {
  state: string;
  municipality: string;
  address: string;
  requestedDate: string;
  urgency: string;
  onUpdate: (fields: Partial<{
    state: string;
    municipality: string;
    address: string;
    requestedDate: string;
    urgency: string;
  }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3LocationSchedule: React.FC<Step3LocationScheduleProps> = ({
  state,
  municipality,
  address,
  requestedDate,
  urgency = 'Normal',
  onUpdate,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFlexibleDate, setIsFlexibleDate] = useState<boolean>(() => {
    return requestedDate === 'Fecha abierta / Por coordinar';
  });

  const sortedStates = useMemo(() => {
    return Object.keys(MEXICO_LOCATIONS).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, []);

  const municipalitiesForState = useMemo(() => {
    if (!state || !MEXICO_LOCATIONS[state]) return [];
    return MEXICO_LOCATIONS[state].slice().sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [state]);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const handleStateChange = (newState: string) => {
    onUpdate({
      state: newState,
      municipality: '', // Reiniciar municipio si cambia estado
    });
    setErrors((prev) => ({ ...prev, state: '' }));
  };

  const handleFlexibleDateToggle = (checked: boolean) => {
    setIsFlexibleDate(checked);
    if (checked) {
      onUpdate({ requestedDate: 'Fecha abierta / Por coordinar' });
      setErrors((prev) => ({ ...prev, requestedDate: '' }));
    } else {
      onUpdate({ requestedDate: '' });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!state.trim()) {
      errs.state = 'Por favor selecciona el estado en México.';
    }
    if (!municipality.trim()) {
      errs.municipality = 'Por favor selecciona el municipio o alcaldía.';
    }
    if (!requestedDate.trim() && !isFlexibleDate) {
      errs.requestedDate = 'Indica la fecha estimada o marca fecha abierta.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-[#EEF7E6] text-[#2D6619] border border-[#C8E6B2]">
            ETAPA 3 DE 4 · UBICACIÓN
          </span>
          <span className="text-xs text-[#56696D]">Logística y programación</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1.5">
          ¿Dónde y cuándo se realizará el servicio?
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-0.5">
          Atención con cuadrillas operativas en Toluca, Valle de México y cobertura nacional.
        </p>
      </div>

      <div className="space-y-4">
        {/* Estado y Municipio (Dependientes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="quoteModalState"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Estado en México *
            </label>
            <select
              id="quoteModalState"
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.state ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
              }`}
            >
              <option value="">-- Selecciona un estado --</option>
              {sortedStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.state}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteModalMunicipality"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
            >
              Municipio / Alcaldía *
            </label>
            <select
              id="quoteModalMunicipality"
              value={municipality}
              disabled={!state}
              onChange={(e) => {
                onUpdate({ municipality: e.target.value });
                setErrors((prev) => ({ ...prev, municipality: '' }));
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                errors.municipality ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
              }`}
            >
              <option value="">
                {state ? '-- Selecciona un municipio --' : 'Primero selecciona un estado'}
              </option>
              {municipalitiesForState.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
            {errors.municipality && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.municipality}
              </span>
            )}
          </div>
        </div>

        {/* Dirección o Referencias del Sitio */}
        <div>
          <label
            htmlFor="quoteModalAddress"
            className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
          >
            Dirección, parque industrial o referencias del sitio (opcional)
          </label>
          <input
            id="quoteModalAddress"
            type="text"
            value={address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Ej. Parque Industrial Toluca 2000, Calle 4 oriente #105"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all"
          />
        </div>

        {/* Fecha y Programación */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quoteModalDate"
                className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1"
              >
                Fecha tentativa requerida *
              </label>
              <input
                id="quoteModalDate"
                type="date"
                min={tomorrow}
                disabled={isFlexibleDate}
                value={isFlexibleDate ? '' : requestedDate}
                onChange={(e) => {
                  onUpdate({ requestedDate: e.target.value });
                  setErrors((prev) => ({ ...prev, requestedDate: '' }));
                }}
                className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all disabled:bg-slate-100 disabled:text-slate-400 ${
                  errors.requestedDate ? 'border-red-400 bg-red-50/20' : 'border-[#CBD5E1]'
                }`}
              />
              {errors.requestedDate && (
                <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                  {errors.requestedDate}
                </span>
              )}
            </div>

            {/* Selector de Urgencia */}
            <div>
              <label className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1">
                Nivel de urgencia
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ urgency: 'Normal' })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    urgency === 'Normal'
                      ? 'border-[#7AC143] bg-[#EEF7E6] text-[#2D6619]'
                      : 'border-[#CBD5E1] bg-white text-[#56696D]'
                  }`}
                >
                  🟢 Normal
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ urgency: 'Alta' })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    urgency === 'Alta'
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-[#CBD5E1] bg-white text-[#56696D]'
                  }`}
                >
                  ⚡ Alta / Urgente
                </button>
              </div>
            </div>
          </div>

          {/* Checkbox de fecha flexible */}
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isFlexibleDate}
              onChange={(e) => handleFlexibleDateToggle(e.target.checked)}
              className="w-4 h-4 rounded text-[#7AC143] focus:ring-[#7AC143] border-slate-300"
            />
            <span className="text-xs text-[#062D3A] font-semibold">
              Todavía no tengo una fecha definida / Requiere coordinación previa
            </span>
          </label>
        </div>
      </div>

      {/* Botones de Navegación */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer"
        >
          <span aria-hidden="true">←</span>
          <span>Regresar a Proyecto</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <span>Continuar a Contacto</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};

