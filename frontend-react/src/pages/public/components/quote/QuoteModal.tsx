import React, { useState, useEffect, useCallback } from 'react';
import { useQuoteModal } from '../../../../context/QuoteModalContext';
import { QuoteWizard } from './QuoteWizard';

export const QuoteModal: React.FC = () => {
  const {
    isOpen,
    closeQuote,
    preselectedServiceCode,
    isDraftDirty,
    resetDraft,
  } = useQuoteModal();

  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Solicitar cierre del modal verificando si hay datos no guardados
  const handleRequestClose = useCallback(() => {
    if (isDraftDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeQuote();
    }
  }, [isDraftDirty, closeQuote]);

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    resetDraft();
    closeQuote();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  // Bloqueo de scroll en el body mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Manejador de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDiscardConfirm, handleRequestClose]);

  if (!isOpen) return null;

  return (
    <div
      id="quoteModalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Solicitud de Cotización MIRA"
      className="fixed inset-0 z-[100] bg-[#061923]/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-6 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        // Cerrar al hacer clic en el backdrop exterior
        if (e.target === e.currentTarget) {
          handleRequestClose();
        }
      }}
    >
      {/* Contenedor flotante del modal: en escritorio flotante 980x630, en móvil pantalla completa */}
      <div
        id="quoteModalContainer"
        className="relative w-full h-full md:h-[630px] md:max-w-[980px] md:max-h-[92vh] md:my-auto md:rounded-xl shadow-2xl border-0 md:border border-[#DFE4DF] dark:border-[#1A3D4D] bg-white dark:bg-[#0B2836] overflow-hidden flex flex-col md:flex-row animate-scaleUp"
      >
        <QuoteWizard
          isModal={true}
          initialServiceCode={preselectedServiceCode}
          onClose={handleRequestClose}
        />

        {/* Modal de confirmación para descartar borrador con datos capturados */}
        {showDiscardConfirm && (
          <div
            id="discardConfirmationModal"
            role="alertdialog"
            aria-labelledby="discardTitle"
            className="absolute inset-0 z-50 bg-[#062D3A]/85 backdrop-blur-md flex items-center justify-center p-4 rounded-2xl animate-fadeIn"
          >
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <h3 id="discardTitle" className="text-lg font-bold text-[#062D3A]">
                ¿Deseas descartar tu solicitud de cotización?
              </h3>
              <p className="text-xs sm:text-sm text-[#56696D]">
                Tienes información capturada en el formulario. Si sales ahora, se perderán las respuestas que no hayas enviado.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="btnCancelDiscard"
                  onClick={handleCancelDiscard}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  id="btnConfirmDiscard"
                  onClick={handleConfirmDiscard}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer shadow-xs"
                >
                  Descartar y salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
