import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthApi } from '../api/health';
import { API_BASE_URL } from '../api/client';

describe('MIRA — Fase 13: Validación de Configuración HTTP y Health Endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. API_BASE_URL está configurado por defecto con el prefijo /api compatible con proxy Vite', () => {
    expect(API_BASE_URL).toBe('/api');
  });

  it('2. healthApi.checkHealth realiza la petición GET al endpoint /health y retorna la estructura esperada', async () => {
    const mockHealth = {
      service: 'mira-api',
      status: 'ok',
      utc: '2026-10-28 22:40:00.000000+00:00',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockHealth,
    } as Response);

    const result = await healthApi.checkHealth();

    expect(result).toEqual(mockHealth);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('3. apiClient maneja correctamente errores HTTP del backend sin exponer la aplicación a fallos no controlados', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' }),
    } as Response);

    await expect(healthApi.checkHealth()).rejects.toThrow('Service Unavailable');
  });
});

