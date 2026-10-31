import React from 'react';
import { getInitials } from '../../../utils/formatters';

interface OperatorProfileViewProps {
  userName?: string;
  userEmail?: string;
}

export const OperatorProfileView: React.FC<OperatorProfileViewProps> = ({
  userName = 'Operador MIRA',
  userEmail = 'operador@mira.com',
}) => {
  const initials = getInitials(userName);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#062D3A]">Mi Perfil Técnico</h2>
        <p className="text-xs text-[#56696D] mt-1">
          Información operativa de tu cuenta de especialista en el Sistema MIRA
        </p>
      </div>

      <div className="bg-white border border-[#E8ECEF] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E8ECEF]">
          <div className="w-16 h-16 rounded-full bg-[#0C3E4F] text-[#7AC143] font-bold text-xl flex items-center justify-center border-2 border-[#7AC143]">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#062D3A]">{userName}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              🛠️ Especialista Técnico Operativo
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Correo Electrónico:</span>
            <span className="font-bold text-[#062D3A]">{userEmail}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Rol en el Sistema:</span>
            <span className="font-bold text-[#062D3A]">OPERATOR (Operador de Campo)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Estatus Operativo:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Activo en Cuadrilla
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Alcance de Operación:</span>
            <span className="font-bold text-[#062D3A]">Cobertura Nacional MIRA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

