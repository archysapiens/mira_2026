import React from 'react';
import type { RequestStatus } from '../../types';

interface StatusTrackerProps {
  status: RequestStatus;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
  const isCanceled = status === 'C';
  const isAttendedDone = status === 'A' || status === 'T';
  const isCompletedDone = status === 'T';

  if (isCanceled) {
    return (
      <div
        className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2"
        role="alert"
      >
        <span className="text-base">⚠️</span>
        <span>Esta solicitud fue cancelada por coordinación.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] border border-[#E8ECEF] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Paso 1: Recibida */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span className="w-6 h-6 rounded-full bg-[#7AC143] text-white flex items-center justify-center text-xs font-bold shrink-0">
          ✓
        </span>
        <span className="text-xs font-bold text-[#062D3A]">1. Recibida</span>
      </div>

      <div className="hidden sm:block flex-1 h-[2px] bg-[#E8ECEF] mx-2" />

      {/* Paso 2: En Atención */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isAttendedDone
              ? 'bg-[#7AC143] text-white'
              : status === 'E'
              ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {isAttendedDone ? '✓' : '2'}
        </span>
        <span
          className={`text-xs font-bold ${
            isAttendedDone
              ? 'text-[#062D3A]'
              : status === 'E'
              ? 'text-[#0369A1]'
              : 'text-gray-400'
          }`}
        >
          2. En Atención
        </span>
      </div>

      <div className="hidden sm:block flex-1 h-[2px] bg-[#E8ECEF] mx-2" />

      {/* Paso 3: Concluida */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isCompletedDone
              ? 'bg-[#7AC143] text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {isCompletedDone ? '✓' : '3'}
        </span>
        <span
          className={`text-xs font-bold ${
            isCompletedDone ? 'text-[#062D3A]' : 'text-gray-400'
          }`}
        >
          3. Concluida
        </span>
      </div>
    </div>
  );
};

