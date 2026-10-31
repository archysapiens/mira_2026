import React, { useState, useMemo } from 'react';
import { MEXICO_LOCATIONS } from '../../../../data/mexicoLocations';

interface Step3ProjectDetailsProps {
  state: string;
  municipality: string;
  address: string;
  requestedDate: string;
  comments: string;
  description: string;
  onChange: (fields: Partial<{
    state: string;
    municipality: string;
    address: string;
    requestedDate: string;
    comments: string;
    description: string;
  }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3ProjectDetails: React.FC<Step3ProjectDetailsProps> = ({
  state,
  municipality,
  address,
  requestedDate,
  comments,
  description,
  onChange,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!state.trim()) {
      errs.state = 'Selecciona un estado.';
    }
    if (!municipality.trim()) {
      errs.municipality = 'Selecciona un municipio o alcaldía.';
    }
    if (!address.trim()) {
      errs.address = 'Ingresa la dirección o referencias del sitio.';
    }
    if (!requestedDate.trim()) {
      errs.requestedDate = 'Indica la fecha requerida.';
    }
    if (!description.trim()) {
      errs.description = 'Describe el proyecto o requerimiento.';
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
      <div>
        <small className="text-[10px] font-bold text-[#7AC143] tracking-widest uppercase">
          PASO 3 DE 4
        </small>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1">
          Ubicación y detalles del trabajo
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-1">
          Indica la ubicación en México y la fecha estimada de intervención.
        </p>
      </div>

      <div className="space-y-4">
        {/* Estado y Municipio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quoteState"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
            >
              Estado en México *
            </label>
            <select
              id="quoteState"
              name="state"
              value={state}
              onChange={(e) => {
                const newState = e.target.value;
                onChange({ state: newState, municipality: '' });
                if (newState) {
                  setErrors((prev) => ({ ...prev, state: '', municipality: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.state ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
              }`}
            >
              <option value="">Selecciona un estado</option>
              {sortedStates.map((s) => (
                <option key={s} value={s}>
                  {s}
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
              htmlFor="quoteMunicipality"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
            >
              Municipio o Alcaldía *
            </label>
            <select
              id="quoteMunicipality"
              name="municipality"
              value={municipality}
              disabled={!state}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ municipality: val });
                if (val) {
                  setErrors((prev) => ({ ...prev, municipality: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                errors.municipality ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
              }`}
            >
              <option value="">
                {state ? 'Selecciona un municipio o alcaldía' : 'Selecciona primero un estado'}
              </option>
              {municipalitiesForState.map((m) => (
                <option key={m} value={m}>
                  {m}
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

        {/* Dirección o referencias */}
        <div>
          <label
            htmlFor="quoteAddress"
            className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
          >
            Dirección o referencias del sitio *
          </label>
          <input
            type="text"
            id="quoteAddress"
            name="address"
            value={address}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ address: val });
              if (val.trim()) {
                setErrors((prev) => ({ ...prev, address: '' }));
              }
            }}
            placeholder="Calle, número, colonia, parque industrial o referencias"
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
              errors.address ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
            }`}
          />
          {errors.address && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">
              {errors.address}
            </span>
          )}
        </div>

        {/* Fecha y Comentarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quoteRequestedDate"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
            >
              Fecha estimada de atención *
            </label>
            <input
              type="date"
              id="quoteRequestedDate"
              name="requestedDate"
              value={requestedDate}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ requestedDate: val });
                if (val) {
                  setErrors((prev) => ({ ...prev, requestedDate: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
                errors.requestedDate ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
              }`}
            />
            {errors.requestedDate && (
              <span className="text-[11px] font-semibold text-red-600 mt-1 block">
                {errors.requestedDate}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteComments"
              className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
            >
              Comentarios adicionales (opcional)
            </label>
            <input
              type="text"
              id="quoteComments"
              name="comments"
              value={comments}
              onChange={(e) => onChange({ comments: e.target.value })}
              placeholder="Horarios permitidos, accesos, etc."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all"
            />
          </div>
        </div>

        {/* Descripción técnica */}
        <div>
          <label
            htmlFor="quoteDescription"
            className="block text-xs font-bold text-[#062D3A] uppercase tracking-wider mb-1.5"
          >
            Descripción del proyecto o requerimiento técnico *
          </label>
          <textarea
            id="quoteDescription"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ description: val });
              if (val.trim()) {
                setErrors((prev) => ({ ...prev, description: '' }));
              }
            }}
            placeholder="Describe las condiciones actuales, metros cuadrados aproximados, alturas, insumos o detalles relevantes..."
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] transition-all ${
              errors.description ? 'border-red-500 bg-red-50/30' : 'border-[#CBD5E1]'
            }`}
          />
          {errors.description && (
            <span className="text-[11px] font-semibold text-red-600 mt-1 block">
              {errors.description}
            </span>
          )}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer"
        >
          ← Volver a Servicios
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <span>Continuar a Contacto</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};

