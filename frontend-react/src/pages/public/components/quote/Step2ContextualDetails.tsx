import React, { useState } from 'react';
import type { NeedType } from '../../../../types';
import {
  getQuestionsForService,
  type ContextQuestion,
  type ContextOption,
} from '../../../../data/contextQuestions';
import { getServiceNameByCode } from '../../../../data/servicePillars';

interface Step2ContextualDetailsProps {
  selectedServiceIds: string[];
  needType: NeedType;
  description: string;
  comments: string;
  contextAnswers: Record<string, string>;
  onUpdate: (fields: {
    needType?: NeedType;
    description?: string;
    comments?: string;
    contextAnswers?: Record<string, string>;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const SPACE_PILLS: { id: NeedType; label: string; icon: string }[] = [
  { id: 'COMPANY', label: 'Empresa / Planta Industrial', icon: '🏢' },
  { id: 'HOTEL', label: 'Hotel / Comercial', icon: '🏨' },
  { id: 'RESIDENCE', label: 'Residencial / Condominio', icon: '🏠' },
  { id: 'OTHER', label: 'Otro Inmueble', icon: '✦' },
];

export const Step2ContextualDetails: React.FC<Step2ContextualDetailsProps> = ({
  selectedServiceIds,
  needType,
  description,
  contextAnswers,
  onUpdate,
  onNext,
  onBack,
}) => {
  const primaryServiceCode = selectedServiceIds[0] || '';
  const primaryServiceName = getServiceNameByCode(primaryServiceCode);
  const questions: ContextQuestion[] = getQuestionsForService(primaryServiceCode);

  const [validationError, setValidationError] = useState<string>('');

  const handleSelectOption = (questionId: string, optionLabel: string) => {
    const updated = { ...contextAnswers, [questionId]: optionLabel };
    onUpdate({ contextAnswers: updated });
    setValidationError('');
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Etapa */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-[#EEF7E6] text-[#2D6619] border border-[#C8E6B2]">
            ETAPA 2 DE 4 · PROYECTO
          </span>
          <span className="text-xs text-[#56696D]">Especificaciones técnicas</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight mt-1.5">
          Detalles del requerimiento: {primaryServiceName}
        </h3>
        <p className="text-xs sm:text-sm text-[#56696D] mt-0.5">
          Responde estas preguntas breves para asignarte al especialista idóneo y preparar tu estimación.
        </p>
      </div>

      {/* 1. Selector Rápido de Tipo de Inmueble / Espacio */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#062D3A] uppercase tracking-wider block">
          Tipo de espacio o instalación *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPACE_PILLS.map((pill) => {
            const isSelected = needType === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onUpdate({ needType: pill.id })}
                className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'border-[#7AC143] bg-[#062D3A] text-white shadow-xs font-bold'
                    : 'border-[#DCE2DD] bg-white hover:border-[#7AC143]/60 text-[#062D3A] font-medium'
                }`}
              >
                <span>{pill.icon}</span>
                <span className="text-xs leading-tight">{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Preguntas Contextuales Dinámicas adaptadas al Servicio */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const currentAnswer = contextAnswers[q.id];

          return (
            <div
              key={q.id}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5"
            >
              <div>
                <span className="text-[10px] font-bold text-[#7AC143] uppercase tracking-widest block">
                  PREGUNTA TÉCNICA {qIndex + 1}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-[#062D3A] leading-snug">
                  {q.title}
                </h4>
                {q.subtitle && (
                  <p className="text-[11px] text-[#56696D] mt-0.5">{q.subtitle}</p>
                )}
              </div>

              {/* Opciones de la pregunta */}
              {q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt: ContextOption) => {
                    const isSelected = currentAnswer === opt.label;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.label)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-[#7AC143] bg-[#EEF7E6] text-[#062D3A] shadow-xs ring-1 ring-[#7AC143]'
                            : 'border-[#DCE2DD] bg-white hover:border-[#7AC143]/50 text-[#062D3A]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#7AC143] bg-[#7AC143] text-white text-[10px]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && '✓'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold leading-tight">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[11px] text-[#56696D] mt-0.5 leading-tight">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Área de Texto para Descripción o Comentarios Adicionales */}
      <div className="space-y-1.5">
        <label
          htmlFor="projectDescription"
          className="text-xs font-bold text-[#062D3A] uppercase tracking-wider block"
        >
          Notas o especificaciones adicionales del proyecto (opcional)
        </label>
        <textarea
          id="projectDescription"
          rows={3}
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe requerimientos especiales, horarios de acceso, condiciones de seguridad o información que consideres relevante..."
          className="w-full p-3 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#062D3A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7AC143] focus:border-transparent transition-all"
        />
      </div>

      {validationError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {validationError}
        </div>
      )}

      {/* Botones de Navegación */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#56696D] hover:text-[#062D3A] transition-colors cursor-pointer"
        >
          <span aria-hidden="true">←</span>
          <span>Regresar a Servicios</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <span>Continuar a Ubicación</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
};
