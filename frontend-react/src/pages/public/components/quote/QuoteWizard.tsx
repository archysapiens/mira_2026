import React, { useState, useEffect } from 'react';
import type { NeedType, QuoteFormData } from '../../../../types';
import { requestsApi } from '../../../../api/requests';
import { Step1SpaceType } from './Step1SpaceType';
import { Step2Services } from './Step2Services';
import { Step3ProjectDetails } from './Step3ProjectDetails';
import { Step4ContactInfo } from './Step4ContactInfo';
import { QuoteSuccessScreen } from './QuoteSuccessScreen';

const NEED_LABELS: Record<NeedType, string> = {
  HOTEL: 'Hotel / Hospedaje',
  RESIDENCE: 'Residencial / Condominio',
  COMPANY: 'Empresa / Planta',
  OTHER: 'Otro espacio',
};

const STEPS = [
  { num: 1, label: 'NECESIDAD' },
  { num: 2, label: 'SERVICIOS' },
  { num: 3, label: 'PROYECTO' },
  { num: 4, label: 'CONTACTO' },
];

export interface QuoteWizardProps {
  initialSpaceType?: NeedType;
  initialServiceCode?: string | null;
  onSuccess?: (folio: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const QuoteWizard: React.FC<QuoteWizardProps> = ({
  initialSpaceType = 'COMPANY',
  initialServiceCode,
  onSuccess,
  onClose,
  isModal = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generatedFolio, setGeneratedFolio] = useState<string>('');
  const [otherSpaceDesc, setOtherSpaceDesc] = useState<string>('');

  const [formData, setFormData] = useState<QuoteFormData>({
    needType: initialSpaceType,
    serviceIds: initialServiceCode ? [initialServiceCode] : [],
    state: '',
    municipality: '',
    address: '',
    requestedDate: '',
    urgency: 'Normal',
    comments: '',
    description: '',
    contactName: '',
    phone: '',
    company: '',
    email: '',
    contextAnswers: {},
  });

  // Preselección de servicio desde los CTAs de la landing
  useEffect(() => {
    if (initialServiceCode) {
      setFormData((prev) => ({
        ...prev,
        serviceIds: prev.serviceIds.includes(initialServiceCode)
          ? prev.serviceIds
          : [initialServiceCode, ...prev.serviceIds],
      }));
    }
  }, [initialServiceCode]);

  useEffect(() => {
    if (initialSpaceType) {
      setFormData((prev) => ({
        ...prev,
        needType: initialSpaceType,
      }));
    }
  }, [initialSpaceType]);

  const handleUpdate = (fields: Partial<QuoteFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep < 1 || targetStep > 4 || isSubmitted) return;

    // Solo permitir saltar si los pasos previos mínimos están satisfechos
    if (targetStep > currentStep) {
      if (currentStep === 1 && targetStep > 1 && !formData.needType) {
        return;
      }
      if (currentStep === 2 && targetStep > 2 && formData.serviceIds.length === 0) {
        return;
      }
      if (targetStep === 4) {
        if (
          !formData.state.trim() ||
          !formData.municipality.trim() ||
          !formData.address.trim() ||
          !formData.requestedDate.trim() ||
          !formData.description.trim()
        ) {
          return;
        }
      }
    }

    setCurrentStep(targetStep);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const locParts = [formData.state, formData.municipality, formData.address].filter(Boolean);
    const locationStr = locParts.length > 0 ? locParts.join(' - ') : 'No especificada';

    // Si especificó descripción para "Otro espacio", anexarla en comentarios
    const extraComments = otherSpaceDesc.trim()
      ? [formData.comments.trim(), `Espacio especificado: ${otherSpaceDesc.trim()}`].filter(Boolean).join(' | ')
      : formData.comments.trim();

    const payload = {
      contactName: formData.contactName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      needType: formData.needType,
      need: NEED_LABELS[formData.needType] || formData.needType,
      serviceIds: formData.serviceIds,
      state: formData.state,
      municipality: formData.municipality,
      address: formData.address.trim(),
      location: locationStr,
      requestedDate: formData.requestedDate,
      description: formData.description.trim(),
      comments: extraComments,
      urgency: formData.urgency || 'Normal',
      source: 'WEB_FUNNEL',
    };

    try {
      const res = await requestsApi.createRequest(payload);
      const folio = res.folio || (res.id ? `MIRA-${res.id.slice(0, 8).toUpperCase()}` : 'MIRA-2026-000000');
      setGeneratedFolio(folio);
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(folio);
      }
    } catch (err: unknown) {
      console.error('Error al enviar cotización:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un inconveniente al enviar la solicitud. Por favor intenta de nuevo.';
      setSubmissionError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      needType: 'COMPANY',
      serviceIds: [],
      state: '',
      municipality: '',
      address: '',
      requestedDate: '',
      urgency: 'Normal',
      comments: '',
      description: '',
      contactName: '',
      phone: '',
      company: '',
      email: '',
      contextAnswers: {},
    });
    setOtherSpaceDesc('');
    setCurrentStep(1);
    setIsSubmitted(false);
    setGeneratedFolio('');
    setSubmissionError(null);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-white dark:bg-[#0B2836] overflow-hidden select-none">
      {/* CABECERA COMPACTA MÓVIL (MIRA + PASO + BOTÓN CERRAR) */}
      <div className="flex md:hidden flex-none bg-gradient-to-r from-[#0B2C3B] to-[#071B24] text-white px-4 py-2.5 items-center justify-between border-b border-white/10 z-20">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/mir.svg"
            alt="MIRA"
            className="w-[68px] h-auto [filter:brightness(0)_invert(1)]"
          />
          <span className="w-1 h-1 rounded-full bg-[#79BD43]" />
          <span className="text-[11px] font-bold text-[#79BD43] uppercase tracking-wider">
            Paso {currentStep} de 4 · {STEPS[currentStep - 1].label}
          </span>
        </div>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            aria-label="Cerrar ventana de cotización"
          >
            ✕
          </button>
        )}
      </div>

      {/* 1. ASIDE LATERAL CORPORATIVO ORIGINAL (AZUL PETRÓLEO MIRA) - SOLO ESCRITORIO */}
      <aside
        aria-label="Información institucional de cotización"
        className="hidden md:flex md:w-[310px] shrink-0 bg-gradient-to-br from-[#0B2C3B] to-[#071B24] text-white p-7 sm:p-8 flex-col justify-between relative overflow-hidden"
      >
        <div className="relative z-10 space-y-4">
          <img
            src="/assets/mir.svg"
            alt="MIRA Soluciones Integrales"
            className="w-[110px] h-auto mb-6 [filter:brightness(0)_invert(1)]"
          />

          <div>
            <small className="text-[11px] font-bold text-[#79BD43] tracking-[0.18em] uppercase block mb-2">
              SOLICITUD GUIADA
            </small>
            <h2 className="font-serif text-[30px] sm:text-[32px] font-normal text-white leading-[1.12] mb-3 max-w-[200px]">
              Cuéntanos sobre tu proyecto
            </h2>
            <p className="text-[13px] text-[#B8C9CB] leading-[1.65]">
              En menos de 2 minutos reúne la información para asignarte al especialista correcto.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/10 mt-auto">
          <small className="text-[11px] text-[#B8C9CB] block">
            Atención nacional · Lunes a sábado
          </small>
        </div>
      </aside>

      {/* 2. ÁREA DERECHA CON STEPPER SUPERIOR FIJO Y CONTENIDO DEL PASO */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0B2836] overflow-hidden relative">
        {/* Botón de cierre en el modal (Desktop) */}
        {isModal && onClose && (
          <button
            type="button"
            id="btnCloseQuoteModal"
            onClick={onClose}
            className="hidden md:flex absolute top-3.5 right-5 w-8 h-8 rounded-full bg-[#EEF2EF] dark:bg-[#123E52] hover:bg-slate-200 dark:hover:bg-[#184F68] text-[#3F5358] dark:text-[#E2E8F0] hover:text-[#102A35] items-center justify-center text-sm font-bold transition-colors cursor-pointer z-20"
            aria-label="Cerrar ventana de cotización"
          >
            ✕
          </button>
        )}

        {/* STEPPER HORIZONTAL DE CUATRO PASOS */}
        {!isSubmitted && (
          <div className="flex-none px-4 sm:px-8 pt-3 sm:pt-5 pb-2.5 sm:pb-3 border-b border-[#DFE4DF] dark:border-[#1A3D4D] bg-white dark:bg-[#0B2836] relative">
            <nav
              id="quoteStepper"
              aria-label="Progreso de la solicitud"
              className="grid grid-cols-4 relative md:mr-8 sm:mr-10"
            >
              {/* Línea conectora base gris */}
              <div className="absolute top-[14px] left-[12%] right-[12%] h-[1px] bg-[#D8DFDC] dark:bg-[#1A3D4D] z-0" />
              {/* Línea conectora activa verde */}
              {currentStep > 1 && (
                <div
                  className="absolute top-[14px] left-[12%] h-[1px] bg-[#79BD43] z-0 transition-all duration-300"
                  style={{
                    width: currentStep === 2 ? '25%' : currentStep === 3 ? '50%' : '75%',
                  }}
                />
              )}

              {STEPS.map((s) => {
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => handleStepJump(s.num)}
                    className="flex flex-col items-center relative z-10 cursor-pointer bg-transparent border-0 p-0 text-center"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted || isActive
                          ? 'bg-[#79BD43] text-white border border-[#79BD43]'
                          : 'bg-white dark:bg-[#08212D] text-[#A9B3B3] dark:text-[#64748B] border border-[#C8D1CE] dark:border-[#1E4555]'
                      }`}
                    >
                      {isCompleted ? '✓' : s.num}
                    </span>
                    <small
                      className={`text-[9px] sm:text-[10px] font-bold tracking-[0.08em] uppercase mt-1.5 block ${
                        isActive || isCompleted ? 'text-[#579D28] dark:text-[#A8D24F]' : 'text-[#A9B3B3] dark:text-[#64748B]'
                      }`}
                    >
                      {s.label}
                    </small>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* CONTENIDO DEL PASO ACTIVO O PANTALLA DE ÉXITO */}
        <div key={isSubmitted ? 'success' : currentStep} className="flex-1 overflow-hidden min-h-0 px-4 sm:px-8 py-3.5 sm:py-5 flex flex-col">
          {isSubmitted ? (
            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              <QuoteSuccessScreen
                folio={generatedFolio}
                email={formData.email}
                onReset={handleReset}
                onClose={onClose}
              />
            </div>
          ) : currentStep === 1 ? (
            <Step1SpaceType
              value={formData.needType}
              onChange={(val) => handleUpdate({ needType: val })}
              onNext={() => setCurrentStep(2)}
              otherDescription={otherSpaceDesc}
              onOtherDescriptionChange={(desc) => setOtherSpaceDesc(desc)}
            />
          ) : currentStep === 2 ? (
            <Step2Services
              spaceType={formData.needType}
              selectedServiceIds={formData.serviceIds}
              onChange={(ids) => handleUpdate({ serviceIds: ids })}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          ) : currentStep === 3 ? (
            <Step3ProjectDetails
              state={formData.state}
              municipality={formData.municipality}
              address={formData.address}
              requestedDate={formData.requestedDate}
              comments={formData.comments}
              description={formData.description}
              onChange={(fields) => handleUpdate(fields)}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          ) : (
            <Step4ContactInfo
              contactName={formData.contactName}
              phone={formData.phone}
              company={formData.company}
              email={formData.email}
              isSubmitting={isSubmitting}
              submissionError={submissionError}
              needType={formData.needType}
              serviceIds={formData.serviceIds}
              state={formData.state}
              municipality={formData.municipality}
              address={formData.address}
              requestedDate={formData.requestedDate}
              description={formData.description}
              onChange={(fields) => handleUpdate(fields)}
              onSubmit={handleSubmit}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
