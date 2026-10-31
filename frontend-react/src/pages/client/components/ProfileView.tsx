import React from 'react';
import { getInitials } from '../../../utils/formatters';

interface ProfileViewProps {
  userName?: string;
  userEmail?: string;
  isEmailVerified: boolean;
  onOpenOtpModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userName = 'Cliente',
  userEmail = '-',
  isEmailVerified,
  onOpenOtpModal,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="bg-white border border-[#E8ECEF] rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        {/* User Strip */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#E8ECEF]">
          <div className="w-16 h-16 rounded-full bg-[#062D3A] text-white flex items-center justify-center text-xl font-black border-2 border-[#7AC143]">
            {getInitials(userName)}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#062D3A]" data-testid="profile-full-name">
              {userName}
            </h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              Cliente
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="divide-y divide-[#F1F5F9] text-xs md:text-sm">
          <div className="flex justify-between items-center py-3">
            <span className="text-[#56696D] font-semibold">Nombre completo</span>
            <span className="font-bold text-[#062D3A]">{userName}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[#56696D] font-semibold">Correo electrónico</span>
            <span className="font-bold text-[#062D3A]">{userEmail}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[#56696D] font-semibold">Rol en el sistema</span>
            <span className="font-bold text-[#062D3A]">Cliente</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[#56696D] font-semibold">Estado del correo</span>
            <div data-testid="profile-verification-status">
              {isEmailVerified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Correo verificado
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Pendiente
                  </span>
                  <button
                    type="button"
                    onClick={onOpenOtpModal}
                    className="px-2.5 py-1 text-xs font-bold text-[#062D3A] bg-white border border-[#E8ECEF] hover:bg-[#062D3A] hover:text-white rounded transition-colors cursor-pointer"
                  >
                    Verificar ahora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs text-[#56696D] leading-relaxed">
          <strong className="text-[#062D3A]">Nota informativa:</strong> Para actualizar tus datos fiscales, dirección de facturación o cambiar el titular de tu cuenta, comunícate con tu asesor MIRA asignado o vía la mesa de atención.
        </div>
      </div>
    </div>
  );
};
