import React, { useState, useMemo } from 'react';
import { MEXICO_LOCATIONS } from '../../../../data/mexicoLocations';
import { funnelFormStyles } from './quoteFormStyles';

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
    <div className="flex flex-col h-full min-h-0 select-none">
      {/* 1. Área central de contenido desplazable */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-3">
        <div>
          <small className="text-[#63A135] dark:text-[#A8D24F] text-[11px] font-bold tracking-[0.15em] uppercase block">
            PASO 3 DE 4
          </small>
          <h3 className="font-serif text-[24px] sm:text-[26px] font-normal text-[#102A35] dark:text-white leading-tight my-1">
            Ubicación y detalles del trabajo
          </h3>
          <p className="text-xs sm:text-[13px] text-[#738083] dark:text-[#94A3B8]">
            Indica la ubicación y fecha estimada.
          </p>
        </div>

        {/* FILA 1: Estado en México y Municipio o Alcaldía */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quoteState"
              className={funnelFormStyles.label}
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
              className={`${funnelFormStyles.selectBase} ${
                errors.state ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            >
              <option value="" className={funnelFormStyles.selectOption}>
                Selecciona un estado
              </option>
              {sortedStates.map((s) => (
                <option key={s} value={s} className={funnelFormStyles.selectOption}>
                  {s}
                </option>
              ))}
            </select>
            {errors.state && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.state}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteMunicipality"
              className={funnelFormStyles.label}
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
              className={`${funnelFormStyles.selectBase} disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                errors.municipality ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            >
              <option value="" className={funnelFormStyles.selectOption}>
                {state ? 'Selecciona un municipio' : 'Selecciona primero un estado'}
              </option>
              {municipalitiesForState.map((m) => (
                <option key={m} value={m} className={funnelFormStyles.selectOption}>
                  {m}
                </option>
              ))}
            </select>
            {errors.municipality && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.municipality}
              </span>
            )}
          </div>
        </div>

        {/* FILA 2: Dirección o referencias del sitio (ancho completo) */}
        <div>
          <label
            htmlFor="quoteAddress"
            className={funnelFormStyles.label}
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
            placeholder="Calle, colonia o referencia"
            className={`${funnelFormStyles.inputBase} ${
              errors.address ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
            }`}
          />
          {errors.address && (
            <span className={funnelFormStyles.errorMessage}>
              {errors.address}
            </span>
          )}
        </div>

        {/* FILA 3: Fecha estimada de atención y Comentarios adicionales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quoteRequestedDate"
              className={funnelFormStyles.label}
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
                if (val.trim()) {
                  setErrors((prev) => ({ ...prev, requestedDate: '' }));
                }
              }}
              placeholder="dd/mm/aaaa"
              className={`${funnelFormStyles.inputBase} ${
                errors.requestedDate ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
              }`}
            />
            {errors.requestedDate && (
              <span className={funnelFormStyles.errorMessage}>
                {errors.requestedDate}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="quoteComments"
              className={funnelFormStyles.label}
            >
              Comentarios adicionales (opcional)
            </label>
            <input
              type="text"
              id="quoteComments"
              name="comments"
              value={comments}
              onChange={(e) => onChange({ comments: e.target.value })}
              placeholder="Horarios o indicaciones"
              className={`${funnelFormStyles.inputBase} ${funnelFormStyles.inputNormal}`}
            />
          </div>
        </div>

        {/* FILA 4: Descripción del proyecto o requerimiento técnico (ancho completo) */}
        <div>
          <label
            htmlFor="quoteDescription"
            className={funnelFormStyles.label}
          >
            Descripción del proyecto o requerimiento técnico *
          </label>
          <textarea
            id="quoteDescription"
            name="description"
            rows={2}
            value={description}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ description: val });
              if (val.trim()) {
                setErrors((prev) => ({ ...prev, description: '' }));
              }
            }}
            placeholder="Describe brevemente el trabajo"
            className={`${funnelFormStyles.textareaBase} ${
              errors.description ? funnelFormStyles.inputError : funnelFormStyles.inputNormal
            }`}
          />
          {errors.description && (
            <span className={funnelFormStyles.errorMessage}>
              {errors.description}
            </span>
          )}
        </div>
      </div>

      {/* 2. Footer inferior fijo */}
      <div className="flex-none pt-3 mt-3 border-t border-[#DFE4DF] dark:border-[#1E4555] bg-white dark:bg-[#0B2836] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] font-bold text-[#657275] hover:text-[#102A35] dark:text-[#94A3B8] dark:hover:text-white bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          ← Atrás
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="bg-[#79BD43] hover:bg-[#66A334] text-white text-[13px] font-bold px-6 py-2.5 rounded transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>Continuar a Contacto</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
