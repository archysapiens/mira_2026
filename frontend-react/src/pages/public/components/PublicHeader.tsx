import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isDemoMode } from '../../../utils/demoMode';

interface PublicHeaderProps {
  onOpenTracking: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onOpenTracking }) => {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'OPERATOR') return '/operador';
    return '/cliente';
  };

  const closeAll = () => {
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      id="siteHeader"
      className="nav siteNavHeader"
      style={isDemoMode() ? { top: '33px' } : undefined}
    >
      {/* Zona Izquierda: Marca y Logotipo Oficial */}
      <div className="headerLeftZone">
        <a className="brand" href="#inicio" onClick={closeAll} aria-label="MIRA - Ir al inicio">
          <img
            src="/assets/mir.svg"
            alt="MIRA"
            width={84}
            height={62}
            className="brandLogo"
          />
          <span className="brandDivider" aria-hidden="true" />
          <span className="brandTagline">Soluciones integrales</span>
        </a>
      </div>

      {/* Zona Central y Derecha dentro del nav semántico */}
      <nav
        id="siteNav"
        className={`headerNavMain ${isMobileMenuOpen ? 'open' : ''}`}
        aria-label="Navegación principal"
      >
        {/* Zona Central: Navegación Principal */}
        <div className="navCenterZone">
          <a href="#inicio" className="navLinkItem" onClick={closeAll}>
            Inicio
          </a>
          <a href="#servicios" className="navLinkItem" onClick={closeAll}>
            Servicios
          </a>
          <a href="#nosotros" className="navLinkItem" onClick={closeAll}>
            Nosotros
          </a>
          <a href="#portafolio" className="navLinkItem" onClick={closeAll}>
            Portafolio
          </a>

          {/* Menú desplegable "Más" en Desktop */}
          <div className="moreDropdownContainer" ref={moreDropdownRef}>
            <button
              type="button"
              className={`moreDropdownToggle ${isMoreOpen ? 'active' : ''}`}
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
            >
              <span>Más</span>
              <svg
                className={`chevronIcon ${isMoreOpen ? 'rotate' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isMoreOpen && (
              <div className="moreDropdownMenu" role="menu">
                <a href="#contacto" role="menuitem" onClick={closeAll}>
                  Contacto
                </a>
                <a href="#preguntas" role="menuitem" onClick={closeAll}>
                  FAQ's
                </a>
                <a href="#donde" role="menuitem" onClick={closeAll}>
                  ¿Dónde?
                </a>
              </div>
            )}
          </div>

          {/* Enlaces secundarios visibles en el menú móvil */}
          <div className="mobileSecondaryLinks">
            <a href="#contacto" onClick={closeAll}>
              Contacto
            </a>
            <a href="#preguntas" onClick={closeAll}>
              FAQ's
            </a>
            <a href="#donde" onClick={closeAll}>
              ¿Dónde?
            </a>
          </div>
        </div>

        {/* Zona Derecha: Acciones de usuario y CTA principal */}
        <div className="navRightZone">
          <button
            type="button"
            id="trackingNavBtn"
            className="trackingNav"
            onClick={() => {
              closeAll();
              onOpenTracking();
            }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              width="14"
              height="14"
              aria-hidden="true"
              className="trackingIcon"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Seguimiento</span>
          </button>

          {isAuthenticated ? (
            <Link to={getDashboardPath()} className="loginCta" onClick={closeAll}>
              <span className="loginIcon">♙</span> Panel ({user?.role})
            </Link>
          ) : (
            <Link to="/login" className="loginCta" onClick={closeAll}>
              <span className="loginIcon">♙</span> Iniciar sesión
            </Link>
          )}

          <a
            href="#cotizar"
            className="navCta"
            onClick={closeAll}
          >
            Cotizar servicio
          </a>
        </div>
      </nav>

      {/* Barra de acciones móvil en cabecera */}
      <div className="mobileHeaderActions">
        <a href="#cotizar" className="navCta mobileCta">
          Cotizar
        </a>
        <button
          type="button"
          className="menuToggle"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
};
