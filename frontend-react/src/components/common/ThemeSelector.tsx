import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeSelectorProps {
  className?: string;
  id?: string;
  variant?: 'toggle' | 'segmented' | 'compact' | 'dropdown';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  id = 'themeToggleBtn',
  variant = 'toggle',
}) => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Si expresamente se requiere segmented para paneles de configuración
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Seleccionar apariencia"
        className={`inline-flex items-center p-1 rounded-lg bg-[#F1F4F1] dark:bg-[#06202B] border border-[#DFE4DF] dark:border-[#1A3D4D] text-xs font-semibold select-none ${className}`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          title="Modo claro"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-[#0F3547] text-[#102A35] dark:text-[#A6D652] shadow-xs font-bold border border-[#CED7D4] dark:border-[#20495E]'
              : 'text-[#627078] dark:text-[#8FA5AD] hover:text-[#102A35] dark:hover:text-white'
          }`}
        >
          <span className="text-xs" aria-hidden="true">☀️</span>
          <span className="text-[11px]">Claro</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          title="Modo oscuro"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-white dark:bg-[#0F3547] text-[#102A35] dark:text-[#A6D652] shadow-xs font-bold border border-[#CED7D4] dark:border-[#20495E]'
              : 'text-[#627078] dark:text-[#8FA5AD] hover:text-[#102A35] dark:hover:text-white'
          }`}
        >
          <span className="text-xs" aria-hidden="true">🌙</span>
          <span className="text-[11px]">Oscuro</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'system'}
          title="Automático (Preferencia del sistema)"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-[#0F3547] text-[#102A35] dark:text-[#A6D652] shadow-xs font-bold border border-[#CED7D4] dark:border-[#20495E]'
              : 'text-[#627078] dark:text-[#8FA5AD] hover:text-[#102A35] dark:hover:text-white'
          }`}
        >
          <span className="text-xs" aria-hidden="true">💻</span>
          <span className="text-[11px]">Auto</span>
        </button>
      </div>
    );
  }

  // Comportamiento único y unificado: Botón circular con icono de Sol (claro) y Luna (oscuro)
  return (
    <button
      type="button"
      id={id}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-[38px] h-[38px] min-w-[38px] min-h-[38px] rounded-full border transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#79BD43] focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-[#092634] hover:bg-[#0F384C] border-[#1C4355] text-amber-300 hover:text-amber-200 shadow-xs'
          : 'bg-[#F2F5F2] hover:bg-[#E5ECE4] border-[#DFE4DF] text-[#102A35] hover:text-[#062D3A] shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        // Icono de LUNA en modo oscuro (representa el modo oscuro activo)
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform duration-200 rotate-0"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        // Icono de SOL en modo claro (representa el modo claro activo)
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform duration-200 rotate-0"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
};

export const ThemeToggle = ThemeSelector;
