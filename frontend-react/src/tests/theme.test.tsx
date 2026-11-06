import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ThemeSelector } from '../components/common/ThemeSelector';

const ThemeHeaderBar: React.FC = () => {
  const { theme, resolvedTheme } = useTheme();
  return (
    <header className="flex items-center justify-between p-4">
      <span data-testid="active-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <ThemeSelector id="themeToggleBtn" />
    </header>
  );
};

describe('Sistema MIRA — Selector de Tema Circular (Sol / Luna)', () => {
  let mediaQueryMatches = false;
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];

  const setupMatchMedia = (isDark: boolean) => {
    mediaQueryMatches = isDark;
    listeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: mediaQueryMatches,
        media: query,
        onchange: null,
        addListener: vi.fn((fn) => listeners.push(fn)),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event, fn) => {
          listeners.push(fn);
        }),
        removeEventListener: vi.fn((_event, fn) => {
          listeners = listeners.filter((l) => l !== fn);
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    setupMatchMedia(false);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  // PRUEBA 1: No existe preferencia guardada y el dispositivo está en modo claro -> MIRA abre en claro y muestra el sol
  it('PRUEBA 1: abre en modo claro con icono de sol cuando no hay preferencia y el SO es light', () => {
    setupMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    const toggleBtn = screen.getByRole('button', { name: 'Cambiar a modo oscuro' });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('title', 'Cambiar a modo oscuro');
    // Verifica que el icono sea el sol (círculo central de rayo)
    expect(toggleBtn.querySelector('circle')).toBeInTheDocument();
  });

  // PRUEBA 2: No existe preferencia guardada y el dispositivo está en modo oscuro -> MIRA abre en oscuro y muestra la luna
  it('PRUEBA 2: abre en modo oscuro con icono de luna cuando no hay preferencia y el SO es dark', () => {
    setupMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const toggleBtn = screen.getByRole('button', { name: 'Cambiar a modo claro' });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('title', 'Cambiar a modo claro');
    // En modo oscuro no hay círculo solar sino silueta lunar
    expect(toggleBtn.querySelector('circle')).not.toBeInTheDocument();
  });

  // PRUEBA 3: El usuario pulsa el sol -> MIRA cambia a oscuro y muestra la luna
  it('PRUEBA 3: pulsar el sol cambia inmediatamente a modo oscuro y muestra la luna', () => {
    setupMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: 'Cambiar a modo oscuro' });
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('active-theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(localStorage.getItem('mira_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Ahora el botón debe tener el aria-label para volver a claro y la luna
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });

  // PRUEBA 4: El usuario pulsa la luna -> MIRA cambia a claro y muestra el sol
  it('PRUEBA 4: pulsar la luna cambia inmediatamente a modo claro y muestra el sol', () => {
    setupMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: 'Cambiar a modo claro' });
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('active-theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(localStorage.getItem('mira_theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    expect(screen.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeInTheDocument();
  });

  // PRUEBA 5: El usuario cambia manualmente el tema y recarga la página -> Se conserva el tema elegido
  it('PRUEBA 5: conserva la preferencia manual guardada en localStorage en recargas posteriores', () => {
    localStorage.setItem('mira_theme', 'dark');

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });

  // PRUEBA 6: No existe preferencia manual y cambia la configuración del sistema operativo -> MIRA sigue al SO
  it('PRUEBA 6: sigue los cambios de preferencia del sistema operativo si no existe selección manual', () => {
    setupMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');

    // Simular que el SO cambia a modo oscuro
    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });

  // PRUEBA 7: Existe preferencia manual y cambia la configuración del sistema operativo -> MIRA conserva la del usuario
  it('PRUEBA 7: no sobrescribe la preferencia manual del usuario ante cambios del sistema operativo', () => {
    setupMatchMedia(false);
    localStorage.setItem('mira_theme', 'light');

    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');

    // Simular cambio del SO a dark
    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    // Debe permanecer en light porque el usuario fijó light manualmente
    expect(screen.getByTestId('active-theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  // PRUEBA 8: Sin menús ni dropdowns, solo un botón accesible
  it('PRUEBA 8: renderiza un único botón circular accesible sin dropdowns ni popovers', () => {
    render(
      <ThemeProvider>
        <ThemeHeaderBar />
      </ThemeProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('type', 'button');
    expect(buttons[0]).not.toHaveAttribute('aria-haspopup');
    expect(buttons[0]).not.toHaveAttribute('aria-expanded');
  });
});
