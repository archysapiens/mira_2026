import React, { useEffect } from 'react';

interface LightboxModalProps {
  isOpen: boolean;
  src: string;
  caption: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  src,
  caption,
  onClose,
}) => {
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

  if (!isOpen || !src) return null;

  return (
    <div
      id="lightboxModal"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes"
      className="lightbox"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        id="lightboxClose"
        onClick={onClose}
        aria-label="Cerrar imagen"
      >
        ×
      </button>

      <figure>
        <img id="lightboxImg" src={src} alt={caption} />
        {caption && <figcaption id="lightboxCaption">{caption}</figcaption>}
      </figure>
    </div>
  );
};
