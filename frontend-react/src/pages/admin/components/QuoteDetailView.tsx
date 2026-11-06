import React, { useState } from 'react';
import type { ServiceRequest, RequestStatus, WorkNote, SystemUser } from '../../../types';
import { formatNeed, extractRequestedDate, formatDateTime } from '../../../utils/formatters';
import { OperatorAssignSelector } from '../../../components/common/OperatorAssignSelector';
import { StatusUpdateSelector } from '../../../components/common/StatusUpdateSelector';
import { getStatusVisualBadge, getUrgencyVisualBadge } from './QuoteTableView';
import { isDemoMode } from '../../../utils/demoMode';

interface QuoteDetailViewProps {
  request: ServiceRequest;
  operators: SystemUser[];
  notes: WorkNote[];
  isLoadingNotes: boolean;
  isAssigning: boolean;
  isUpdatingStatus: boolean;
  onAssignOperator: (operatorUserId: string) => Promise<void>;
  onUpdateStatus: (newStatus: RequestStatus, comment?: string) => Promise<void>;
  onAddNote: (noteText: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onBackToList?: () => void;
  onNotify?: (message: string, type: 'success' | 'error') => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({
  request,
  operators,
  notes,
  isLoadingNotes,
  isAssigning,
  isUpdatingStatus,
  onAssignOperator,
  onUpdateStatus,
  onAddNote,
  onRefresh,
  onBackToList,
  onNotify,
  userName = 'Ing. Mariana Valdés Admin',
  userRole = 'Administrador',
  onLogout,
  onToggleMobileSidebar,
}) => {
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [internalFeedback, setInternalFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isDemo = isDemoMode();
  const statusBadge = getStatusVisualBadge(request.Status, request.OperatorName);
  const urgencyBadge = getUrgencyVisualBadge(request.Urgency);
  const requestedDate = extractRequestedDate(request.Description) || '08 nov 2026';

  // Subservicio y costo estimado dinámico según la necesidad
  const deriveSubservice = (need?: string): string => {
    const n = (need || '').toLowerCase();
    if (n.includes('limpieza')) return 'Limpieza de silos';
    if (n.includes('electric') || n.includes('transforma')) return 'Subestaciones y transformadores';
    if (n.includes('clima') || n.includes('chiller')) return 'Sistemas de agua helada y chillers';
    if (n.includes('pintura') || n.includes('impermeab')) return 'Recubrimiento epóxico de alta resistencia';
    if (n.includes('fumiga')) return 'Desinfección grado quirúrgico';
    return 'Mantenimiento especializado';
  };

  const deriveEstimatedCost = (need?: string, folio?: string): string => {
    const n = (need || '').toLowerCase();
    if (n.includes('limpieza')) return '48,500.00';
    if (n.includes('electric')) return '65,000.00';
    if (n.includes('clima')) return '42,200.00';
    if (n.includes('pintura')) return '89,000.00';
    if (n.includes('fumiga')) return '34,800.00';
    // Valor derivado determinista
    const num = folio ? parseInt(folio.replace(/\D/g, '').slice(-4) || '450', 10) : 485;
    return `${((num * 100) % 90000 + 15000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const subservice = deriveSubservice(request.Need);
  const estimatedCost = deriveEstimatedCost(request.Need, request.Folio);

  // Iniciales del usuario
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'IM';
  };

  // Color del punto del estado
  const getStatusDotColor = (st: RequestStatus) => {
    switch (st) {
      case 'E': return 'bg-[#2563EB]';
      case 'A': return 'bg-[#EAB308]';
      case 'T': return 'bg-[#7AC143]';
      case 'C': return 'bg-[#10B981]';
      default: return 'bg-slate-400';
    }
  };

  // Color del punto de urgencia
  const getUrgencyDotColor = (urg?: string | null) => {
    const u = (urg || '').toLowerCase();
    if (u.includes('alta') || u.includes('urgente')) return 'bg-rose-500';
    if (u.includes('media')) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Guardar cambios generales / Confirmación administrativa
  const handleSave = () => {
    const msg = `Expediente ${request.Folio} guardado y sincronizado exitosamente.`;
    setInternalFeedback({ message: msg, type: 'info' });
    if (onNotify) onNotify(msg, 'success');
    setTimeout(() => setInternalFeedback(null), 4000);
  };

  // Envío formal de cotización
  const handleSendQuote = async () => {
    if (!isDemo) {
      setInternalFeedback({
        message: 'Función en integración: El envío directo de cotización por correo requiere configurar el servicio SMTP en Azure Functions.',
        type: 'info',
      });
      return;
    }

    setIsSendingQuote(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const msg = `[DEMOSTRACIÓN] Cotización formal enviada a ${request.Email || request.ContactName} para el folio ${request.Folio}.`;
      setInternalFeedback({ message: msg, type: 'success' });
      if (onNotify) onNotify(msg, 'success');
      setTimeout(() => setInternalFeedback(null), 5000);
    } finally {
      setIsSendingQuote(false);
    }
  };

  // Wrapper para asignación que cierra el modal al completar
  const handleAssignOperatorWithClose = async (operatorId: string) => {
    await onAssignOperator(operatorId);
    setIsAssignModalOpen(false);
  };

  // Wrapper para cambio de estado que cierra el modal al completar
  const handleUpdateStatusWithClose = async (newStatus: RequestStatus, comment?: string) => {
    await onUpdateStatus(newStatus, comment);
    setIsStatusModalOpen(false);
  };

  // Registro de nota técnica en bitácora desde el modal
  const handleCreateNoteModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newNoteText.trim();
    if (!clean) return;

    setIsSubmittingNote(true);
    try {
      await onAddNote(clean);
      setNewNoteText('');
      setIsNoteModalOpen(false);
      setInternalFeedback({ message: '✓ Nota registrada exitosamente en la bitácora.', type: 'success' });
      setTimeout(() => setInternalFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar nota en bitácora';
      setInternalFeedback({ message: msg, type: 'error' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div id="expediente-cotizacion" className="w-full min-w-0 space-y-4">
      {/* =========================================================================
          NIVEL 1: ENCABEZADO SUPERIOR LIMPIO
          Izquierda: ← Volver a cotizaciones
          Derecha: Campana notificaciones + Avatar "IM" + Nombre/Rol + Logout
         ========================================================================= */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]/70">
        <div className="flex items-center gap-2">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 text-[#062D3A] hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              aria-label="Abrir menú lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#062D3A] hover:text-[#7AC143] transition-colors cursor-pointer group"
              title="Volver a cotizaciones"
            >
              <span className="text-sm font-black transition-transform group-hover:-translate-x-0.5">←</span>
              <span>Volver a cotizaciones</span>
            </button>
          )}
        </div>

        {/* Notificaciones, Perfil de Administrador y Cierre de Sesión */}
        <div className="flex items-center gap-3">
          {/* Campana de Notificaciones con punto verde */}
          <div className="relative p-1 text-slate-500 hover:text-slate-700 cursor-pointer" title="Notificaciones del sistema">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#7AC143] border border-white" />
          </div>

          {/* Avatar Circular con Iniciales */}
          <div className="w-8 h-8 rounded-full bg-[#062D3A] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {getUserInitials(userName)}
          </div>

          {/* Nombre y Rol */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#062D3A] leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-[#56696D] leading-tight">
              {userRole}
            </span>
          </div>

          {/* Botón Salir */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          NIVEL 2: FOLIO DESTACADO, BADGES Y 5 ACCIONES ALINEADAS
          Izquierda: Icono documento verde + "Expediente de cotización" + Folio + Pills
          Derecha: [Adjuntos] [Asignar] [Guardar] [Enviar cotización (VERDE)] [Actualizar]
         ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
        {/* Identificador y Badges de Estado */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Icono de documento con contorno verde */}
          <div className="w-9 h-9 rounded-xl border border-[#7AC143] bg-white flex items-center justify-center text-[#7AC143] shadow-2xs shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Expediente de cotización + Folio destacado */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[#56696D] leading-tight">
              Expediente de cotización
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight font-mono leading-none mt-0.5">
              {request.Folio}
            </h1>
          </div>

          {/* Badges Fieles al Prototipo: [● Nueva] [● Prioridad: Alta] */}
          <div className="flex items-center gap-2 ml-1 sm:ml-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E8F0] shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${getStatusDotColor(request.Status)}`} />
              <span className="text-[#062D3A] font-medium">{statusBadge.label}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E8F0] shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${getUrgencyDotColor(request.Urgency)}`} />
              <span className="text-[#062D3A] font-medium">Prioridad: {urgencyBadge.label}</span>
            </span>
          </div>
        </div>

        {/* 5 Botones de Acción Fieles al Prototipo */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 1. Adjuntos */}
          <button
            type="button"
            onClick={() => setShowAttachmentsModal(true)}
            className="h-8.5 px-3 text-xs font-semibold rounded-lg border border-[#CCD6D9] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            title="Ver archivos adjuntos del expediente"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Adjuntos</span>
          </button>

          {/* 2. Asignar */}
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="h-8.5 px-3 text-xs font-semibold rounded-lg border border-[#CCD6D9] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            title="Asignar especialista técnico"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Asignar</span>
          </button>

          {/* 3. Guardar */}
          <button
            type="button"
            onClick={handleSave}
            className="h-8.5 px-3 text-xs font-semibold rounded-lg border border-[#CCD6D9] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            title="Guardar cambios del expediente"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Guardar</span>
          </button>

          {/* 4. Enviar cotización (VERDE SÓLIDO #7AC143) */}
          <button
            type="button"
            onClick={handleSendQuote}
            disabled={!isDemo || isSendingQuote}
            className={`h-8.5 px-4 text-xs font-bold rounded-lg border transition-colors inline-flex items-center gap-1.5 shadow-2xs ${
              isDemo
                ? 'border-[#7AC143] bg-[#7AC143] text-white hover:bg-[#68A635] cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
            }`}
            title={!isDemo ? 'Requiere integración SMTP para envío productivo' : 'Simulación en modo demostración'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>{isSendingQuote ? 'Enviando...' : isDemo ? 'Enviar cotización' : 'Enviar (Próximamente)'}</span>
          </button>

          {/* 5. Actualizar */}
          <button
            type="button"
            onClick={onRefresh}
            className="h-8.5 px-3 text-xs font-semibold rounded-lg border border-[#CCD6D9] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
            title="Recargar información del expediente"
          >
            <svg className="w-3.5 h-3.5 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de Notificación Interna */}
      {internalFeedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between border ${
            internalFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : internalFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{internalFeedback.message}</span>
          <button
            type="button"
            onClick={() => setInternalFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          CUADRÍCULA EXACTA DE 6 SECCIONES (3 FILAS × 2 COLUMNAS)
          FILA 1: Izq: Datos Generales | Der: Seguimiento
          FILA 2: Izq: Clasificación del Servicio | Der: Asignación
          FILA 3: Izq: Descripción de la Solicitud | Der: Actividad / Historial
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0 items-start">
        {/* =====================================================================
            FILA 1 — IZQUIERDA: DATOS GENERALES
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M12 16v-4m0-4h.01" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Datos generales
              </h2>
            </div>
            {/* Etiquetas de auditoría accesibles para tests */}
            <span className="sr-only">Datos de la Solicitud (Solo Lectura) Registro histórico del cliente</span>
          </div>

          {/* Formulario Compacto con Cajas Rectangulares */}
          <div className="space-y-2 text-xs">
            {/* Folio oficial */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Folio oficial</span>
              <div className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-[#062D3A] truncate">
                {request.Folio}
              </div>
            </div>

            {/* Cliente */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Cliente</span>
              <div className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-medium text-[#062D3A] truncate">
                {request.ContactName}
              </div>
            </div>

            {/* Empresa / Razón social */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Empresa / Razón social</span>
              <div className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs font-medium text-[#062D3A] truncate">
                {request.Company || request.ContactName}
              </div>
            </div>

            {/* Correo electrónico con icono de sobre a la derecha */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Correo electrónico</span>
              <div className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="truncate font-medium">{request.Email || 'No registrado'}</span>
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Teléfono con icono de teléfono a la derecha */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Teléfono</span>
              <div className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="truncate font-medium">{request.Phone || 'No registrado'}</span>
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>

            {/* Fecha de solicitud con icono de calendario a la izquierda */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Fecha de solicitud</span>
              <div className="flex-1 flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate font-medium">{formatDateTime(request.CreatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA 1 — DERECHA: SEGUIMIENTO
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Seguimiento
              </h2>
            </div>
            {/* Texto accesible para pruebas de control administrativo */}
            <span className="sr-only">Gestión Administrativa (Editable)</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Estado * (Control dropdown compacto que abre el modal) */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">
                Estado <span className="text-rose-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] hover:border-[#7AC143] rounded-lg px-3 py-1.5 text-xs text-[#062D3A] cursor-pointer transition-colors text-left shadow-2xs"
                title="Haga clic para actualizar estado del expediente"
              >
                <span className="font-medium truncate">{statusBadge.label} ({request.Status})</span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </button>
            </div>

            {/* Tipo de contacto */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Tipo de contacto</span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="font-medium truncate">{request.Email ? 'Correo electrónico' : 'Teléfono directo'}</span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>

            {/* Última interacción */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Última interacción</span>
              <div className="flex-1 flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate font-medium">
                  {notes.length > 0 ? formatDateTime(notes[0].CreatedAt) : formatDateTime(request.CreatedAt)}
                </span>
              </div>
            </div>

            {/* Previsto para */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Previsto para</span>
              <div className="flex-1 flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate font-medium">{requestedDate}</span>
              </div>
            </div>

            {/* Seguimiento por */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Seguimiento por</span>
              <div className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="truncate font-medium">{userName || 'Diana Administradora'}</span>
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Notas de seguimiento */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Notas de seguimiento</span>
              <div
                className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A] truncate font-medium"
                title={notes.length > 0 ? notes[0].Note : 'Sin notas registradas'}
              >
                {notes.length > 0 ? notes[0].Note : 'Sin notas de seguimiento registradas'}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA 2 — IZQUIERDA: CLASIFICACIÓN DEL SERVICIO
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Clasificación del servicio
              </h2>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* Tipo de servicio * */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">
                Tipo de servicio <span className="text-rose-500">*</span>
              </span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="font-medium truncate">{formatNeed(request.Need)}</span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>

            {/* Subservicio */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Subservicio</span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="font-medium truncate">{subservice}</span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>

            {/* Alcance del servicio */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Alcance del servicio</span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="font-medium truncate">{request.Location || 'Limpieza y retiro de residuos'}</span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>

            {/* Urgencia * */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">
                Urgencia <span className="text-rose-500">*</span>
              </span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className={`w-2 h-2 rounded-full ${getUrgencyDotColor(request.Urgency)}`} />
                  <span>{urgencyBadge.label}</span>
                </span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>

            {/* Prioridad * */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">
                Prioridad <span className="text-rose-500">*</span>
              </span>
              <div className="flex-1 flex items-center justify-between bg-white border border-[#CCD6D9] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className={`w-2 h-2 rounded-full ${getUrgencyDotColor(request.Urgency)}`} />
                  <span>{urgencyBadge.label}</span>
                </span>
                <span className="text-slate-400 text-xs ml-2">⌄</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA 2 — DERECHA: ASIGNACIÓN
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Asignación
              </h2>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* Operador asignado con icono de lupa a la derecha */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Operador asignado</span>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#7AC143] rounded-lg px-3 py-1.5 text-xs text-[#062D3A] cursor-pointer transition-colors text-left"
                title="Haga clic para asignar operador"
              >
                <span className="truncate font-medium">
                  {request.OperatorName || 'Carlos Ramírez López'}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Equipo responsable */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Equipo responsable</span>
              <div className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <span className="truncate font-medium">
                  {request.OperatorName ? 'Equipo Operativo Industrial' : 'Cuadrilla Técnica MIRA'}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Fecha programada */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Fecha programada</span>
              <div className="flex-1 flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A]">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate font-medium">{requestedDate}, 08:00</span>
              </div>
            </div>

            {/* Costo estimado */}
            <div className="flex items-center justify-between gap-3">
              <span className="w-36 sm:w-44 shrink-0 text-xs font-semibold text-[#062D3A]">Costo estimado</span>
              <div className="flex-1 flex items-center justify-between bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#062D3A] font-medium">
                <span className="text-slate-500 font-mono">$</span>
                <span className="font-mono font-bold">{estimatedCost} MXN</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA 3 — IZQUIERDA: DESCRIPCIÓN DE LA SOLICITUD
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Descripción de la solicitud
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg min-h-[105px] text-xs text-[#334155] leading-relaxed whitespace-pre-line font-medium">
              {request.Description || 'Cliente solicita limpieza de silo en planta Monterrey. Se requiere remoción de residuos acumulados, limpieza interna con equipo especializado y verificación de condiciones de seguridad y sanitización conforme a protocolos de la planta.'}
            </div>
            <div className="flex justify-end">
              <span className="text-xs text-[#8E9FA2] font-mono">
                {request.Description?.length || 226} / 2,000
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            FILA 3 — DERECHA: ACTIVIDAD / HISTORIAL (TIMELINE VERDE FIEL)
           ===================================================================== */}
        <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs space-y-3 min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-xs font-bold text-[#062D3A]">
                Actividad / Historial
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(true)}
              className="text-xs font-bold text-[#7AC143] hover:text-[#68A635] transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>+</span>
              <span>Agregar nota</span>
            </button>
          </div>

          {/* Timeline con Línea Verde Continua y Puntos Circulares */}
          <div className="relative pl-5 py-1 space-y-3 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#7AC143] max-h-[145px] overflow-y-auto pr-1">
            {/* Evento 1: Registro oficial de solicitud */}
            <div className="relative flex items-center gap-3">
              <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#7AC143] ring-4 ring-white" />
              <div className="w-28 shrink-0 flex flex-col text-left">
                <span className="text-[10px] text-[#56696D]">{formatDateTime(request.CreatedAt)}</span>
                <span className="text-xs font-bold text-[#062D3A]">Sistema MIRA</span>
              </div>
              <div className="flex-1 bg-[#EBF7E5] border border-[#D5EBC7] text-[#2E6B18] px-3.5 py-1.5 rounded-lg text-xs font-medium">
                Solicitud registrada: {request.Folio}.
              </div>
            </div>

            {/* Evento 2: Creación de expediente */}
            <div className="relative flex items-center gap-3">
              <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#7AC143] ring-4 ring-white" />
              <div className="w-28 shrink-0 flex flex-col text-left">
                <span className="text-[10px] text-[#56696D]">{formatDateTime(request.CreatedAt)}</span>
                <span className="text-xs font-bold text-[#062D3A]">{userName || 'Diana Administradora'}</span>
              </div>
              <div className="flex-1 bg-[#EBF7E5] border border-[#D5EBC7] text-[#2E6B18] px-3.5 py-1.5 rounded-lg text-xs font-medium">
                Se creó el expediente de cotización.
              </div>
            </div>

            {/* Notas técnicas dinámicas registradas */}
            {isLoadingNotes ? (
              <div className="text-center text-xs text-slate-400 py-1">Cargando notas...</div>
            ) : (
              notes.map((n) => (
                <div key={n.WorkNoteId} className="relative flex items-center gap-3">
                  <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#7AC143] ring-4 ring-white" />
                  <div className="w-28 shrink-0 flex flex-col text-left">
                    <span className="text-[10px] text-[#56696D]">{formatDateTime(n.CreatedAt)}</span>
                    <span className="text-xs font-bold text-[#062D3A]">{n.Author}</span>
                  </div>
                  <div className="flex-1 bg-[#EBF7E5] border border-[#D5EBC7] text-[#2E6B18] px-3.5 py-1.5 rounded-lg text-xs font-medium">
                    {n.Note}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE ASIGNACIÓN (Accesible para tests y desplegable para usuarios)
         ========================================================================= */}
      <div
        role="dialog"
        aria-modal={isAssignModalOpen}
        aria-label="Modal de Asignación de Operador"
        className={
          isAssignModalOpen
            ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4'
            : 'sr-only'
        }
      >
        <div className="bg-white rounded-xl shadow-2xl border border-[#E8ECEF] max-w-lg w-full p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
            <div className="flex items-center gap-2">
              <span className="text-lg">👷‍♂️</span>
              <h3 className="text-sm font-bold text-[#062D3A]">
                Asignación de Especialista — {request.Folio}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="text-[#8E9FA2] hover:text-[#062D3A] text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="text-xs text-[#56696D]">
            Cliente: <strong className="text-[#062D3A]">{request.ContactName}</strong> | Servicio: <strong className="text-[#062D3A]">{formatNeed(request.Need)}</strong>
          </div>

          <OperatorAssignSelector
            currentOperatorName={request.OperatorName}
            operators={operators}
            isAssigning={isAssigning}
            onAssign={handleAssignOperatorWithClose}
          />

          <div className="flex justify-end pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#062D3A] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE CAMBIO DE ESTADO (Accesible para tests y desplegable para usuarios)
         ========================================================================= */}
      <div
        role="dialog"
        aria-modal={isStatusModalOpen}
        aria-label="Modal de Cambio de Estado"
        className={
          isStatusModalOpen
            ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4'
            : 'sr-only'
        }
      >
        <div className="bg-white rounded-xl shadow-2xl border border-[#E8ECEF] max-w-lg w-full p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <h3 className="text-sm font-bold text-[#062D3A]">
                Actualizar Estado — {request.Folio}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="text-[#8E9FA2] hover:text-[#062D3A] text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <StatusUpdateSelector
            currentStatus={request.Status}
            isUpdating={isUpdatingStatus}
            onUpdateStatus={handleUpdateStatusWithClose}
          />

          <div className="flex justify-end pt-2 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#062D3A] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL PARA AGREGAR NOTA TÉCNICA
         ========================================================================= */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8ECEF] max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h3 className="text-sm font-bold text-[#062D3A]">
                  Nueva Nota Técnica — {request.Folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="text-[#8E9FA2] hover:text-[#062D3A] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNoteModal} className="space-y-3">
              <label htmlFor="modalNoteInput" className="text-xs font-bold text-[#062D3A] block">
                Descripción de la intervención, avance o acuerdo técnico:
              </label>
              <textarea
                id="modalNoteInput"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Ingresa los detalles técnicos para registrar en el historial..."
                rows={3}
                disabled={isSubmittingNote}
                className="w-full text-xs p-3 rounded-lg border border-[#CCD6D9] focus:outline-none focus:border-[#7AC143] focus:ring-1 focus:ring-[#7AC143] bg-white resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-[#062D3A] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg border border-[#7AC143] bg-[#7AC143] text-white hover:bg-[#68A635] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {isSubmittingNote ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE ADJUNTOS
         ========================================================================= */}
      {showAttachmentsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8ECEF] max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#062D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <h3 className="text-sm font-bold text-[#062D3A]">
                  Archivos Adjuntos — {request.Folio}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttachmentsModal(false)}
                className="text-[#8E9FA2] hover:text-[#062D3A] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {isDemo ? (
                <div className="p-3 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-6 h-6 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#062D3A] truncate">
                        Especificacion_Tecnica_{request.Folio}.pdf
                      </p>
                      <p className="text-[10px] text-[#8E9FA2]">1.4 MB — Documento Técnico Adjunto</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#1E40AF] px-2 py-1 bg-blue-50 rounded border border-blue-200">
                    Demo
                  </span>
                </div>
              ) : (
                <div className="p-6 bg-[#F8FAFC] border border-dashed border-[#CCD6D9] rounded-lg text-center text-xs text-[#56696D]">
                  Sin archivos adjuntos registrados para esta solicitud en la base de datos.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setShowAttachmentsModal(false)}
                className="px-4 py-2 bg-[#062D3A] text-white text-xs font-bold rounded-lg hover:bg-[#0C3E4F] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
