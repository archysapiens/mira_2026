import React from 'react';
import { getInitials } from '../../../utils/formatters';

interface AdminProfileViewProps {
  userName?: string;
  userEmail?: string;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  userName = 'Administrador General',
  userEmail = 'admin@mira.com',
}) => {
  const initials = getInitials(userName);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#062D3A]">Perfil de Administración</h2>
        <p className="text-xs text-[#56696D] mt-1">
          Credenciales y facultades operativas del perfil administrativo en MIRA
        </p>
      </div>

      <div className="bg-white border border-[#E8ECEF] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E8ECEF]">
          <div className="w-16 h-16 rounded-full bg-[#0C3E4F] text-[#7AC143] font-bold text-xl flex items-center justify-center border-2 border-[#7AC143]">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#062D3A]">{userName}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              🛡️ Administrador del Sistema
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Correo Electrónico:</span>
            <span className="font-bold text-[#062D3A]">{userEmail}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Rol Criptográfico:</span>
            <span className="font-bold text-[#062D3A]">ADMIN (Permisos de Gestión Total)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Facultades Habilitadas:</span>
            <span className="font-bold text-[#062D3A]">
              Asignar Especialistas · Actualizar Estatus · Bitácora · Crear Usuarios
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8ECEF]">
            <span className="text-[#8E9FA2]">Nivel de Acceso:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Acceso Integral a Solicitudes Nacionales
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

