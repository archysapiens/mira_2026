import React, { useState } from 'react';
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

interface QuoteWizardProps {
  initialSpaceType?: NeedType;
  initialServiceCode?: string;
}

export const QuoteWizard: React.FC<QuoteWizardProps> = ({
  initialSpaceType = 'HOTEL',
  initialServiceCode,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [generatedFolio, setGeneratedFolio] = useState<string>('');

  const [formData, setFormData] = useState<QuoteFormData>({
    needType: initialSpaceType,
    serviceIds: initialServiceCode ? [initialServiceCode] : [],
    state: '',
    municipality: '',
    address: '',
    requestedDate: '',
    comments: '',
    description: '',
    contactName: '',
    phone: '',
    company: '',
    email: '',
  });

  const handleUpdate = (fields: Partial<QuoteFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep < 1 || targetStep > 4 || isSubmitted) return;

    if (targetStep > currentStep) {
      if (currentStep === 2 && targetStep > 2 && formData.serviceIds.length === 0) {
        return;
      }
      if (currentStep === 3 && targetStep === 4) {
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
      comments: formData.comments.trim(),
      source: 'WEB',
    };

    try {
      const res = await requestsApi.createRequest(payload);
      const folio = res.folio || (res.id ? `MIRA-${res.id.slice(0, 8).toUpperCase()}` : 'MIRA-2026-000000');
      setGeneratedFolio(folio);
      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error('Error al enviar cotización:', err);
      const errMsg = err instanceof Error ? err.message : 'Ocurrió un inconveniente al enviar la solicitud. Por favor intenta de nuevo.';
      setSubmissionError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      needType: 'HOTEL',
      serviceIds: [],
      state: '',
      municipality: '',
      address: '',
      requestedDate: '',
      comments: '',
      description: '',
      contactName: '',
      phone: '',
      company: '',
      email: '',
    });
    setCurrentStep(1);
    setIsSubmitted(false);
    setGeneratedFolio('');
    setSubmissionError(null);
  };

  return (
    <section className="py-16 sm:py-24 bg-[#f4f1e9]" id="cotizar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#dfe4df] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* ASIDE LATERAL CORPORATIVO (AZUL PETRÓLEO) */}
          <aside
            aria-label="Información institucional de cotización"
            className="lg:col-span-4 bg-gradient-to-br from-[#0b2c3b] to-[#071b24] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-10 space-y-4">
              <img
                src="/assets/mir.svg"
                alt="MIRA Soluciones Integrales"
                className="w-28 brightness-0 invert"
                width={115}
                height={85}
              />
              <div>
                <p className="eyebrow">
                  Solicitud guiada
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight mt-2 leading-tight">
                  Cuéntanos sobre tu proyecto.
                </h2>
                <p className="text-xs sm:text-sm text-[#b8c9cb] mt-3 leading-relaxed">
                  En menos de 2 minutos reúne la información para asignarte al especialista correcto.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/10 mt-8">
              <small className="text-[11px] text-[#b8c9cb] leading-normal block">
                <b className="text-white font-bold">Atención nacional</b> · Coordinación centralizada para proyectos industriales, comerciales y residenciales.
              </small>
            </div>

            {/* Decoración de fondo */}
            <div
              className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#79bd43]/10 rounded-full blur-2xl pointer-events-none"
              aria-hidden="true"
            />
          </aside>

          {/* ÁREA DERECHA CON WIZARD Y STEPPER */}
          <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between">
            {!isSubmitted && (
              <nav
                id="quoteStepper"
                aria-label="Progreso de la solicitud"
                className="grid grid-cols-4 gap-2 mb-8 pb-6 border-b border-slate-100"
              >
                {[
                  { num: 1, label: 'Espacio' },
                  { num: 2, label: 'Servicios' },
                  { num: 3, label: 'Proyecto' },
                  { num: 4, label: 'Contacto' },
                ].map((s) => {
                  const isActive = currentStep === s.num;
                  const isCompleted = currentStep > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => handleStepJump(s.num)}
                      className={`flex flex-col sm:flex-row items-center sm:gap-2.5 p-2 rounded-xl text-center sm:text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EEF7E6] text-[#062D3A] font-bold'
                          : isCompleted
                          ? 'text-[#7AC143] font-medium hover:bg-slate-50'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          isActive
                            ? 'bg-[#7AC143] text-white shadow-xs'
                            : isCompleted
                            ? 'bg-[#EEF7E6] text-[#7AC143]'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : s.num}
                      </span>
                      <small className="text-[11px] tracking-tight">{s.label}</small>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* CONTENIDO DEL PASO O SUCCESS SCREEN */}
            <div key={isSubmitted ? 'success' : currentStep} className="stepTransition flex-1">
              {isSubmitted ? (
                <QuoteSuccessScreen
                  folio={generatedFolio}
                  email={formData.email}
                  onReset={handleReset}
                />
              ) : currentStep === 1 ? (
                <Step1SpaceType
                  value={formData.needType}
                  onChange={(val) => handleUpdate({ needType: val })}
                  onNext={() => setCurrentStep(2)}
                />
              ) : currentStep === 2 ? (
                <Step2Services
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
                  onChange={(fields) => handleUpdate(fields)}
                  onSubmit={handleSubmit}
                  onBack={() => setCurrentStep(3)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

