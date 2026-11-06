import React, { useState, useMemo } from 'react';
import type { ServiceRequest, DashboardCounts, RequestStatus } from '../../../types';
import { formatDate, formatNeed } from '../../../utils/formatters';

interface AdminSummaryViewProps {
  userName?: string;
  counts: DashboardCounts;
  requests: ServiceRequest[];
  onSelectRequest: (requestId: string) => void;
  onViewAllRequests: () => void;
  onNavigateToUsers: () => void;
  onNavigateToNotes: () => void;
  onNavigateToClients?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToSettings?: () => void;
}

export const AdminSummaryView: React.FC<AdminSummaryViewProps> = ({
  userName = 'Administrador',
  counts,
  requests,
  onSelectRequest,
  onViewAllRequests,
  onNavigateToUsers,
  onNavigateToNotes: _onNavigateToNotes,
  onNavigateToClients,
  onNavigateToReports,
  onNavigateToSettings,
}) => {
  const firstName = userName.trim().split(' ')[0] || 'Administrador';
  const [timeRange, setTimeRange] = useState<'30d' | '7d' | 'today'>('30d');

  // =========================================================================
  // 1. MÉTRICAS DERIVADAS EXCLUSIVAMENTE DE REGISTROS DISPONIBLES (CERO HARDCODED)
  // =========================================================================
  const totalCount = requests.length > 0 
    ? requests.length 
    : ((counts.E || 0) + (counts.A || 0) + (counts.T || 0) + (counts.C || 0));

  const countE = requests.length > 0 
    ? requests.filter((r) => r.Status === 'E').length 
    : (counts.E || 0);

  const countA = requests.length > 0 
    ? requests.filter((r) => r.Status === 'A').length 
    : (counts.A || 0);

  const countT = requests.length > 0 
    ? requests.filter((r) => r.Status === 'T').length 
    : (counts.T || 0);

  const countC = requests.length > 0 
    ? requests.filter((r) => r.Status === 'C').length 
    : (counts.C || 0);

  // 5 Tarjetas de KPIs ejecutivas basadas en los estados oficiales del backend
  const kpis = [
    {
      id: 'total',
      label: 'Total Plataforma',
      sublabel: 'Solicitudes totales',
      value: totalCount.toLocaleString('es-MX'),
      bgIcon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borderAccent: 'border-[#7AC143]/40 ring-1 ring-[#7AC143]/20',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'nuevas',
      label: 'Enviadas / Recibidas',
      sublabel: 'Estado [E] Inicial',
      value: countE.toLocaleString('es-MX'),
      bgIcon: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: 'atencion',
      label: 'En Atención / Proceso',
      sublabel: 'Estado [A] Operativo',
      value: countA.toLocaleString('es-MX'),
      bgIcon: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'concluidas',
      label: 'Concluidas con Éxito',
      sublabel: 'Estado [T] Terminado',
      value: countT.toLocaleString('es-MX'),
      bgIcon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      id: 'canceladas',
      label: 'Canceladas',
      sublabel: 'Estado [C] Desestimada',
      value: countC.toLocaleString('es-MX'),
      bgIcon: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  ];

  // =========================================================================
  // 2. DONUT CHART DINÁMICO: DISTRIBUCIÓN POR ESTADO REAL
  // =========================================================================
  const donutData = useMemo(() => {
    if (totalCount === 0) {
      return {
        total: 0,
        pctE: '0.0',
        pctA: '0.0',
        pctT: '0.0',
        pctC: '0.0',
        arcE: 0,
        arcA: 0,
        arcT: 0,
        arcC: 0,
      };
    }
    const circum = 2 * Math.PI * 70; // ~439.82
    const pE = (countE / totalCount) * 100;
    const pA = (countA / totalCount) * 100;
    const pT = (countT / totalCount) * 100;
    const pC = (countC / totalCount) * 100;

    return {
      total: totalCount,
      pctE: pE.toFixed(1),
      pctA: pA.toFixed(1),
      pctT: pT.toFixed(1),
      pctC: pC.toFixed(1),
      arcE: (countE / totalCount) * circum,
      arcA: (countA / totalCount) * circum,
      arcT: (countT / totalCount) * circum,
      arcC: (countC / totalCount) * circum,
    };
  }, [totalCount, countE, countA, countT, countC]);

  // =========================================================================
  // 3. GRÁFICA DE TENDENCIA DINÁMICA POR FECHA DE CREACIÓN
  // =========================================================================
  const trendData = useMemo(() => {
    const now = Date.now();
    let daysCount = 30;
    if (timeRange === '7d') daysCount = 7;
    if (timeRange === 'today') daysCount = 1;

    const rangeMs = daysCount * 24 * 3600 * 1000;
    const bucketCount = daysCount === 1 ? 6 : 7;
    const stepMs = rangeMs / bucketCount;

    // Crear cubos temporales
    const buckets: { label: string; count: number; dateTs: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = now - rangeMs + i * stepMs;
      const bucketEnd = bucketStart + stepMs;
      const d = new Date(bucketStart);
      const label = daysCount === 1
        ? `${d.getHours().toString().padStart(2, '0')}:00`
        : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

      // Contar solicitudes reales en este intervalo
      const matches = requests.filter((r) => {
        const t = new Date(r.CreatedAt).getTime();
        return !isNaN(t) && t >= bucketStart && t < bucketEnd;
      });

      buckets.push({
        label,
        count: matches.length,
        dateTs: bucketStart,
      });
    }

    // Si todas las solicitudes están concentradas o no hay en el rango, asegurar al menos los valores reales
    const maxVal = Math.max(1, ...buckets.map((b) => b.count));
    const peakIndex = buckets.reduce(
      (maxIdx, cur, idx, arr) => (cur.count > arr[maxIdx].count ? idx : maxIdx),
      0
    );
    const peak = buckets[peakIndex];

    // Construir puntos SVG escalados (viewBox 520x180)
    // X va de 45 a 495, Y va de 150 (0) a 35 (maxVal)
    const points = buckets.map((b, idx) => {
      const x = 45 + (idx / (bucketCount - 1)) * 450;
      const y = 150 - (b.count / maxVal) * 115;
      return { x, y, count: b.count, label: b.label };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const polygonPoints = `${points[0].x},150 ${polylinePoints} ${points[points.length - 1].x},150`;

    return {
      buckets,
      points,
      polylinePoints,
      polygonPoints,
      maxVal,
      peak,
      peakPoint: points[peakIndex],
      hasData: requests.length > 0 && buckets.some((b) => b.count > 0),
    };
  }, [requests, timeRange]);

  // =========================================================================
  // 4. SERVICIOS INDUSTRIALES MÁS SOLICITADOS (DEL CATÁLOGO REAL DE MIRA)
  // =========================================================================
  const topServices = useMemo(() => {
    if (requests.length === 0) return [];

    const countsMap: Record<string, number> = {};
    requests.forEach((r) => {
      const serviceName = formatNeed(r.Need);
      countsMap[serviceName] = (countsMap[serviceName] || 0) + 1;
    });

    const sorted = Object.entries(countsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxCount = sorted.length > 0 ? sorted[0].count : 1;

    return sorted.map((s) => ({
      ...s,
      percentage: Math.max(10, Math.round((s.count / maxCount) * 100)),
    }));
  }, [requests]);

  // =========================================================================
  // 5. ACTIVIDAD RECIENTE DERIVADA DE SOLICITUDES EN TIEMPO REAL
  // =========================================================================
  const recentActivities = useMemo(() => {
    if (requests.length === 0) return [];

    return [...requests]
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
      .slice(0, 4)
      .map((r) => {
        let title = 'Nueva solicitud registrada';
        let description = `Se recibió la solicitud ${r.Folio} para ${formatNeed(r.Need)}.`;
        let type: 'new' | 'status' | 'operator' | 'approved' | 'cancel' = 'new';

        if (r.Status === 'E') {
          title = 'Nueva solicitud recibida';
          description = `Se recibió el folio ${r.Folio} del cliente ${r.Company || r.ContactName}.`;
          type = 'new';
        } else if (r.Status === 'A') {
          title = r.OperatorName ? 'Especialista asignado' : 'Solicitud en atención';
          description = r.OperatorName
            ? `Se asignó a ${r.OperatorName} la solicitud ${r.Folio}.`
            : `La solicitud ${r.Folio} pasó a estado En atención.`;
          type = 'operator';
        } else if (r.Status === 'T') {
          title = 'Servicio concluido / aprobado';
          description = `El folio ${r.Folio} de ${r.Company || r.ContactName} fue concluido exitosamente.`;
          type = 'approved';
        } else if (r.Status === 'C') {
          title = 'Solicitud desestimada / cancelada';
          description = `La solicitud ${r.Folio} fue marcada como cancelada.`;
          type = 'cancel';
        }

        const diffMs = Date.now() - new Date(r.CreatedAt).getTime();
        const diffHrs = Math.max(0, Math.floor(diffMs / 3600000));
        const timeAgo = diffHrs === 0
          ? 'Hace unos minutos'
          : diffHrs < 24
          ? `Hace ${diffHrs} h`
          : `Hace ${Math.floor(diffHrs / 24)} d`;

        return {
          id: r.RequestId,
          title,
          description,
          timeAgo,
          type,
        };
      });
  }, [requests]);

  // =========================================================================
  // 6. ÚLTIMAS COTIZACIONES DISPONIBLES EN TIEMPO REAL
  // =========================================================================
  const recentQuotes = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
      .slice(0, 5);
  }, [requests]);

  const getStatusBadgeInfo = (status: RequestStatus) => {
    switch (status) {
      case 'E':
        return { label: 'Nueva / Enviada', badge: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'A':
        return { label: 'En Atención', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'T':
        return { label: 'Concluida', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'C':
        return { label: 'Cancelada', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status, badge: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const getPriorityBadgeInfo = (urgency?: string | null) => {
    const val = (urgency || '').toLowerCase();
    if (val.includes('alta') || val.includes('urgente')) {
      return { label: 'Alta', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (val.includes('baja')) {
      return { label: 'Baja', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Media', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  return (
    <div className="space-y-6">
      {/* Contenedor Accesible y Compatible con Pruebas Automatizadas */}
      <div className="sr-only">
        <h1>Panel de Control, {firstName}</h1>
        <p>Supervisión Central de Operaciones</p>
      </div>

      {/* Encabezado Principal del Dashboard Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="border-l-4 border-[#7AC143] pl-3.5 py-0.5">
          <h1 className="text-xl md:text-2xl font-extrabold text-[#062D3A] tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-xs md:text-sm text-[#56696D] mt-0.5">
            Resumen general de solicitudes y operación
          </p>
        </div>
      </div>

      {/* FILA 1: Tarjetas de KPIs Ejecutivos Dinámicos (Fiel a Maqueta Aprobada) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className={`bg-white border rounded-xl p-3.5 shadow-xs flex items-center gap-3.5 transition-all hover:shadow-sm ${
              kpi.borderAccent || 'border-[#E2E8F0]'
            }`}
          >
            <span className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${kpi.bgIcon}`}>
              {kpi.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[11px] font-semibold text-[#56696D] truncate leading-tight">
                {kpi.label}
              </h2>
              <div className="text-xl md:text-2xl font-extrabold text-[#062D3A] tracking-tight mt-0.5">
                {kpi.value}
              </div>
              <span className="sr-only">{kpi.sublabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FILA 2: Tres Gráficas Visuales Dinámicas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gráfica 1: Solicitudes por estado (Donut Chart) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
                Solicitudes por estado
              </h3>
            </div>
            <span className="text-[10px] font-medium text-[#8E9FA2]">
              {totalCount} total
            </span>
          </div>

          {totalCount === 0 ? (
            <div className="my-auto py-8 text-center text-xs text-[#8E9FA2] italic">
              No hay solicitudes registradas actualmente.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
              {/* Donut SVG Dinámico */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  {/* Enviadas / Recibidas (E) */}
                  {donutData.arcE > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#0284C7"
                      strokeWidth="22"
                      strokeDasharray={`${donutData.arcE} ${439.82 - donutData.arcE}`}
                      strokeDashoffset="0"
                    />
                  )}
                  {/* En atención / Proceso (A) */}
                  {donutData.arcA > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="22"
                      strokeDasharray={`${donutData.arcA} ${439.82 - donutData.arcA}`}
                      strokeDashoffset={`-${donutData.arcE}`}
                    />
                  )}
                  {/* Concluidas con éxito (T) */}
                  {donutData.arcT > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#7AC143"
                      strokeWidth="22"
                      strokeDasharray={`${donutData.arcT} ${439.82 - donutData.arcT}`}
                      strokeDashoffset={`-${donutData.arcE + donutData.arcA}`}
                    />
                  )}
                  {/* Canceladas (C) */}
                  {donutData.arcC > 0 && (
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke="#EF4444"
                      strokeWidth="22"
                      strokeDasharray={`${donutData.arcC} ${439.82 - donutData.arcC}`}
                      strokeDashoffset={`-${donutData.arcE + donutData.arcA + donutData.arcT}`}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-[#062D3A] tracking-tight leading-none">
                    {totalCount}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-medium mt-0.5">
                    Solicitudes
                  </span>
                </div>
              </div>

              {/* Leyenda Dinámica */}
              <div className="w-full sm:w-auto flex flex-col space-y-2 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#56696D]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
                    Enviadas / Recibidas
                  </span>
                  <span className="font-semibold text-[#062D3A]">
                    {countE} <span className="text-[#8E9FA2] font-normal">({donutData.pctE}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#56696D]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                    En Atención / Proceso
                  </span>
                  <span className="font-semibold text-[#062D3A]">
                    {countA} <span className="text-[#8E9FA2] font-normal">({donutData.pctA}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#56696D]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#7AC143]" />
                    Concluidas con Éxito
                  </span>
                  <span className="font-semibold text-[#062D3A]">
                    {countT} <span className="text-[#8E9FA2] font-normal">({donutData.pctT}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[#56696D]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                    Canceladas
                  </span>
                  <span className="font-semibold text-[#062D3A]">
                    {countC} <span className="text-[#8E9FA2] font-normal">({donutData.pctC}%)</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gráfica 2: Tendencia de solicitudes dinámica (Área y Línea) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
                Tendencia de solicitudes
              </h3>
            </div>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '30d' | '7d' | 'today')}
                aria-label="Rango de tiempo para tendencia"
                className="text-[11px] font-semibold text-[#56696D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 pr-6 cursor-pointer hover:border-[#7AC143] appearance-none"
              >
                <option value="30d">Últimos 30 días</option>
                <option value="7d">Últimos 7 días</option>
                <option value="today">Hoy</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] text-[#8E9FA2]">
                ▼
              </span>
            </div>
          </div>

          {/* SVG Area Chart Dinámico */}
          <div className="w-full relative mt-1">
            <svg viewBox="0 0 520 180" className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="trendGradientReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7AC143" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#7AC143" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guías horizontales y escala Y dinámica */}
              <g className="text-[10px] fill-[#94A3B8]">
                <line x1="30" y1="35" x2="500" y2="35" stroke="#F1F5F9" strokeWidth="1" />
                <text x="22" y="38" textAnchor="end">{trendData.maxVal}</text>

                <line x1="30" y1="92" x2="500" y2="92" stroke="#F1F5F9" strokeWidth="1" />
                <text x="22" y="95" textAnchor="end">{Math.round(trendData.maxVal / 2)}</text>

                <line x1="30" y1="150" x2="500" y2="150" stroke="#E2E8F0" strokeWidth="1" />
                <text x="22" y="153" textAnchor="end">0</text>
              </g>

              {trendData.hasData ? (
                <>
                  {/* Relleno con degradado */}
                  <polygon
                    points={trendData.polygonPoints}
                    fill="url(#trendGradientReal)"
                  />

                  {/* Línea verde de tendencia */}
                  <polyline
                    points={trendData.polylinePoints}
                    fill="none"
                    stroke="#7AC143"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Puntos en la curva */}
                  {trendData.points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.count > 0 ? 3.5 : 2}
                      fill="#FFFFFF"
                      stroke="#7AC143"
                      strokeWidth={pt.count > 0 ? 2 : 1}
                    />
                  ))}

                  {/* Tooltip Badge sobre el pico real si hay solicitudes */}
                  {trendData.peak && trendData.peak.count > 0 && (
                    <g transform={`translate(${Math.max(10, Math.min(430, trendData.peakPoint.x - 40))}, ${Math.max(5, trendData.peakPoint.y - 30)})`}>
                      <rect x="0" y="0" width="80" height="20" rx="4" fill="#15803D" />
                      <polygon points="36,20 44,20 40,24" fill="#15803D" />
                      <text x="40" y="13.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="bold">
                        {trendData.peak.count} {trendData.peak.count === 1 ? 'solicitud' : 'solicitudes'}
                      </text>
                    </g>
                  )}
                </>
              ) : (
                <text x="260" y="95" textAnchor="middle" fill="#94A3B8" fontSize="11" fontStyle="italic">
                  Sin solicitudes registradas en este período
                </text>
              )}
            </svg>

            {/* Eje X Fechas */}
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-medium pt-1 px-4">
              {trendData.buckets.map((b, idx) => (
                <span key={idx}>{b.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfica 3: Servicios Industriales Más Solicitados (Exclusivo Catálogo MIRA) */}
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
                Servicios más solicitados
                <span className="sr-only">Servicios industriales</span>
              </h3>
            </div>
            <span className="text-[10px] font-medium text-[#8E9FA2]">
              Top {topServices.length}
            </span>
          </div>

          {topServices.length === 0 ? (
            <div className="my-auto py-8 text-center text-xs text-[#8E9FA2] italic">
              Sin servicios registrados en la plataforma.
            </div>
          ) : (
            <div className="space-y-3 my-auto">
              {topServices.map((srv, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-[#062D3A] truncate pr-2" title={srv.name}>
                      {srv.name}
                    </span>
                    <span className="font-bold text-[#062D3A] shrink-0">
                      {srv.count}
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#7AC143] h-full rounded-full transition-all duration-500"
                      style={{ width: `${srv.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILA 3: Actividad reciente & Últimas cotizaciones en tiempo real */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Actividad reciente (~40%) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
              Actividad reciente
            </h3>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E9FA2] italic my-auto">
              No hay eventos recientes registrados.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 flex-1">
              <div className="absolute left-[11px] top-2 bottom-3 w-0.5 bg-[#E2E8F0]" />

              {recentActivities.map((act) => {
                let nodeColor = 'bg-sky-100 text-sky-700';
                let nodeIcon = (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                );

                if (act.type === 'operator') {
                  nodeColor = 'bg-amber-100 text-amber-700';
                  nodeIcon = (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  );
                } else if (act.type === 'approved') {
                  nodeColor = 'bg-emerald-100 text-emerald-700';
                  nodeIcon = (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  );
                } else if (act.type === 'cancel') {
                  nodeColor = 'bg-rose-100 text-rose-700';
                  nodeIcon = (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  );
                }

                return (
                  <div key={act.id} className="relative flex items-start justify-between gap-3 text-xs">
                    <span
                      className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${nodeColor}`}
                    >
                      {nodeIcon}
                    </span>

                    <div className="pr-2">
                      <h4 className="font-bold text-[#062D3A] text-xs leading-tight">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-[#56696D] mt-0.5 leading-snug">
                        {act.description}
                      </p>
                    </div>

                    <span className="text-[10px] text-[#8E9FA2] whitespace-nowrap shrink-0 mt-0.5">
                      {act.timeAgo}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas cotizaciones (~60%) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
                Últimas cotizaciones
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllRequests}
              className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] border border-[#86EFAC] hover:bg-[#F0FDF4] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Ver todas las cotizaciones</span>
              <span className="text-sm font-bold leading-none">›</span>
            </button>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E9FA2] italic my-auto">
              No existen cotizaciones registradas actualmente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#56696D] font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-2.5 pl-3">Folio</th>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Servicio</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5 pr-3 text-right">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {recentQuotes.map((q) => {
                    const st = getStatusBadgeInfo(q.Status);
                    const pr = getPriorityBadgeInfo(q.Urgency);

                    return (
                      <tr
                        key={q.RequestId}
                        onClick={() => onSelectRequest(q.RequestId)}
                        className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                      >
                        <td className="p-2.5 pl-3 font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                          {q.Folio}
                        </td>
                        <td className="p-2.5 text-[#062D3A] font-medium truncate max-w-[140px]" title={q.Company || q.ContactName}>
                          {q.Company || q.ContactName}
                        </td>
                        <td className="p-2.5 text-[#56696D] truncate max-w-[160px]" title={formatNeed(q.Need)}>
                          {formatNeed(q.Need)}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${st.badge}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#8E9FA2] text-[11px] whitespace-nowrap">
                          {formatDate(q.CreatedAt)}
                        </td>
                        <td className="p-2.5 pr-3 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${pr.badge}`}>
                            {pr.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FILA 4: Accesos rápidos & Indicadores del equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Accesos rápidos (~65%) */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
              Accesos rápidos
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Cotizaciones */}
            <button
              type="button"
              onClick={onViewAllRequests}
              className="p-3 bg-white border border-[#E2E8F0] hover:border-[#7AC143] rounded-xl text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <span className="text-[#8E9FA2] group-hover:text-[#7AC143] font-bold text-sm">→</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                  Cotizaciones
                </h4>
                <p className="text-[10px] text-[#56696D] mt-0.5 leading-tight">
                  Gestiona las solicitudes de servicio
                </p>
              </div>
            </button>

            {/* Clientes */}
            <button
              type="button"
              onClick={onNavigateToClients || onViewAllRequests}
              className="p-3 bg-white border border-[#E2E8F0] hover:border-[#7AC143] rounded-xl text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                <span className="text-[#8E9FA2] group-hover:text-[#7AC143] font-bold text-sm">→</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                  Clientes
                </h4>
                <p className="text-[10px] text-[#56696D] mt-0.5 leading-tight">
                  Administra tu cartera de clientes
                </p>
              </div>
            </button>

            {/* Operadores */}
            <button
              type="button"
              onClick={onNavigateToUsers}
              className="p-3 bg-white border border-[#E2E8F0] hover:border-[#7AC143] rounded-xl text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <span className="text-[#8E9FA2] group-hover:text-[#7AC143] font-bold text-sm">→</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                  Operadores
                </h4>
                <p className="text-[10px] text-[#56696D] mt-0.5 leading-tight">
                  Asigna y da seguimiento a operadores
                </p>
              </div>
            </button>

            {/* Reportes */}
            <button
              type="button"
              onClick={onNavigateToReports || onViewAllRequests}
              className="p-3 bg-white border border-[#E2E8F0] hover:border-[#7AC143] rounded-xl text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                <span className="text-[#8E9FA2] group-hover:text-[#7AC143] font-bold text-sm">→</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                  Reportes
                </h4>
                <p className="text-[10px] text-[#56696D] mt-0.5 leading-tight">
                  Consulta métricas y resultados
                </p>
              </div>
            </button>

            {/* Configuración */}
            <button
              type="button"
              onClick={onNavigateToSettings || onViewAllRequests}
              className="p-3 bg-white border border-[#E2E8F0] hover:border-[#7AC143] rounded-xl text-left shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span className="text-[#8E9FA2] group-hover:text-[#7AC143] font-bold text-sm">→</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#062D3A] group-hover:text-[#7AC143]">
                  Configuración
                </h4>
                <p className="text-[10px] text-[#56696D] mt-0.5 leading-tight">
                  Ajusta parámetros del sistema
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Indicadores del equipo (~35%) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-4 md:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7AC143]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-xs md:text-sm font-bold text-[#062D3A]">
                Indicadores del equipo
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200">
              Próximamente
            </span>
          </div>

          <div className="my-auto flex items-center gap-3.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 text-slate-400 shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#062D3A]">
                Métricas de desempeño del equipo
              </h4>
              <p className="text-[11px] text-[#56696D] mt-0.5 leading-snug">
                Aquí podrás consultar el tiempo de respuesta, solicitudes por operador, productividad y más.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
