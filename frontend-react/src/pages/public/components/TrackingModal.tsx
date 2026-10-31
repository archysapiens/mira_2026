import React, { useState, useEffect } from 'react';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose }) => {
  const [folio, setFolio] = useState('');
  const [email, setEmail] = useState('');
  const [statusResult, setStatusResult] = useState<{
    folio: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio.trim() || !email.trim()) return;
    setStatusResult({
      folio: folio.trim().toUpperCase(),
      email: email.trim(),
    });
  };

  return (
    <div
      id="trackingModal"
      role="dialog"
      aria-modal="true"
      aria-label="Consulta tu solicitud"
      className="trackingBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div id="trackingModalContent" className="trackingModal">
        <button
          type="button"
          id="trackingClose"
          onClick={onClose}
          aria-label="Cerrar modal de seguimiento"
          className="modalClose"
        >
          ×
        </button>

        <p className="eyebrow dark">Seguimiento por folio</p>
        <h2>Consulta tu solicitud</h2>
        <p>
          Ingresa el folio asignado y el correo electrónico registrado para revisar el estado actual de tu
          proyecto.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Folio MIRA *
            <input
              type="text"
              id="trackingFolioInput"
              name="folio"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej. MIRA-2026-123456"
              required
            />
          </label>

          <label>
            Correo registrado *
            <input
              type="email"
              id="trackingEmailInput"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </label>

          <button type="submit" id="trackingSubmitBtn">
            Consultar
          </button>
        </form>

        {statusResult && (
          <div className="trackingResult" id="trackingResultCard">
            <strong>Búsqueda de Folio: {statusResult.folio}</strong>
            <small>Correo asociado: {statusResult.email}</small>
            <div className="statusBadge">[E] Enviada</div>

            <div className="statusFlow">
              <span className="active">
                <i>1</i> Solicitada
              </span>
              <span>
                <i>2</i> Asignada
              </span>
              <span>
                <i>3</i> Terminada
              </span>
            </div>

            <div className="statusLegend">
              <span>
                <b>[E]</b> Solicitud registrada
              </span>
              <span>
                <b>[A]</b> Especialista asignado
              </span>
              <span>
                <b>[T]</b> Servicio concluido
              </span>
              <span>
                <b>[C]</b> Solicitud cancelada
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
