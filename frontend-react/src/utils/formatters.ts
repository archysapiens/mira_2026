import type { RequestStatus } from '../types';

export const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  E: {
    label: 'Enviada',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  A: {
    label: 'En atención',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  T: {
    label: 'Terminada',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  C: {
    label: 'Cancelada',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    dotClass: 'bg-red-500',
  },
};

export const NEED_TYPE_MAP: Record<string, string> = {
  HOTEL: 'Hotel / Hospedaje',
  RESIDENCE: 'Residencial / Condominio',
  COMPANY: 'Empresa / Planta',
  OTHER: 'Otro espacio',
};

export function formatNeed(need?: string | null): string {
  if (!need) return 'Servicio general MIRA';
  const key = String(need).trim().toUpperCase();
  return NEED_TYPE_MAP[key] || need;
}

export function formatDescription(desc?: string | null): string {
  if (!desc) return 'Sin descripción adicional proporcionada.';
  let formatted = desc;
  for (const [code, label] of Object.entries(NEED_TYPE_MAP)) {
    const regex = new RegExp(`Tipo de inmueble:\\s*${code}\\b`, 'gi');
    formatted = formatted.replace(regex, `Tipo de inmueble: ${label}`);
  }
  return formatted;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function extractRequestedDate(desc?: string | null): string | null {
  if (!desc) return null;
  const match = desc.match(/fecha\s*(?:requerida|solicitada)?\s*:\s*([^\n\r,]+)/i);
  return match ? match[1].trim() : null;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'M';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getRoleLabel(role?: string | null): string {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN':
      return 'Administrador';
    case 'OPERATOR':
      return 'Operador Especialista';
    case 'CLIENT':
      return 'Cliente';
    default:
      return role || 'Usuario';
  }
}

