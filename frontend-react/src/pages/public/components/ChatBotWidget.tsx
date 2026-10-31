import React, { useState } from 'react';
import type { NeedType } from '../../../types';

interface ChatBotWidgetProps {
  onSelectSpace: (space: NeedType) => void;
}

export const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({ onSelectSpace }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOptionClick = (space: NeedType) => {
    onSelectSpace(space);
    setIsOpen(false);
    const quoteEl = document.getElementById('cotizar');
    if (quoteEl) {
      quoteEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="chatWidget" id="chatWidget">
      <button
        type="button"
        id="chatLauncher"
        className="chatLauncher"
        aria-label="Abrir asistente MIRA Bot"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span aria-hidden="true">✦</span>
        <b>MIRA Bot</b>
      </button>

      {isOpen && (
        <div
          id="chatPanel"
          role="dialog"
          aria-label="Asistente de cotización MIRA Bot"
          className="chatPanel"
        >
          {/* Header */}
          <header>
            <div className="botAvatar">✦</div>
            <div>
              <b style={{ fontSize: '13px', color: '#fff' }}>MIRA Bot</b>
              <small>Asistente virtual de servicios</small>
            </div>
            <button
              type="button"
              id="chatClose"
              aria-label="Cerrar chat"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          {/* Body */}
          <div className="chatBody">
            <div className="botMessage">
              ¡Hola! Soy el asistente virtual de MIRA. ¿En qué tipo de inmueble o proyecto necesitas
              atención?
            </div>

            <div className="chatOptions">
              <button type="button" onClick={() => handleOptionClick('HOTEL')}>
                🏨 Hotel / Hospedaje
              </button>
              <button type="button" onClick={() => handleOptionClick('RESIDENCE')}>
                🏡 Residencial
              </button>
              <button type="button" onClick={() => handleOptionClick('COMPANY')}>
                🏭 Empresa / Planta
              </button>
              <button type="button" onClick={() => handleOptionClick('OTHER')}>
                🏢 Otro espacio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
