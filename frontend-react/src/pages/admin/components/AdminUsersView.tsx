import React, { useState } from 'react';
import type { SystemUser, UserRole } from '../../../types';
import { getRoleLabel } from '../../../utils/formatters';
import { usersApi } from '../../../api/users';

interface AdminUsersViewProps {
  users: SystemUser[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo usuario
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    const name = (u.FullName || '').toLowerCase();
    const mail = (u.Email || '').toLowerCase();
    const rCode = (u.RoleCode || '').toLowerCase();
    return !term || name.includes(term) || mail.includes(term) || rCode.includes(term);
  });

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setFeedback({ message: 'Nombre y correo son obligatorios.', type: 'error' });
      return;
    }
    setIsCreating(true);
    setFeedback(null);
    try {
      await usersApi.createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: password.trim() || 'Temporal2026!',
      });
      setFeedback({ message: '✓ Usuario registrado correctamente.', type: 'success' });
      setFullName('');
      setEmail('');
      setPassword('');
      await onRefresh();
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear usuario';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeClass = (rCode: string) => {
    switch (rCode.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OPERATOR':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#062D3A] leading-tight">
            Usuarios del Sistema MIRA
          </h2>
          <p className="text-xs sm:text-sm text-[#56696D] mt-1">
            Administra las cuentas de clientes corporativos, cuadrillas de especialistas y administradores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing || isLoading}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-[#E8ECEF] bg-white hover:bg-[#F8FAFC] text-[#062D3A] transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{isRefreshing ? 'Actualizando...' : '🔄 Actualizar lista'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7AC143] hover:bg-[#68A635] text-white transition-colors cursor-pointer shadow-xs"
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabla con Búsqueda */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E8ECEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuario por nombre, correo o rol..."
            className="max-w-md w-full px-3 py-2 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
            data-testid="admin-users-search-input"
          />
          <span className="text-xs text-[#8E9FA2]">
            {filteredUsers.length} usuario{filteredUsers.length === 1 ? '' : 's'} registrado{filteredUsers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#56696D] font-bold border-b border-[#E8ECEF]">
              <tr>
                <th className="p-3.5">Nombre Completo</th>
                <th className="p-3.5">Correo Electrónico</th>
                <th className="p-3.5">Rol de Acceso</th>
                <th className="p-3.5">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEF]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-[#8E9FA2]" role="status">
                    Cargando usuarios del sistema...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-[#8E9FA2] italic">
                    No se encontraron usuarios en la plataforma.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.IsActive !== false;
                  return (
                    <tr key={u.UserId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-bold text-[#062D3A]">{u.FullName || '-'}</td>
                      <td className="p-3.5 text-[#56696D]">{u.Email || '-'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeClass(u.RoleCode)}`}>
                          {getRoleLabel(u.RoleCode)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#041E27]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8ECEF] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8ECEF]">
              <h3 className="text-base font-bold text-[#062D3A]">Registrar Nuevo Usuario</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E9FA2] hover:text-[#062D3A] p-1 rounded"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#062D3A] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Ing. Daniel Méndez"
                  className="w-full px-3 py-2 border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#062D3A] mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#062D3A] mb-1">Rol de Acceso</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] text-[#062D3A]"
                >
                  <option value="OPERATOR">Operador Especialista (OPERATOR)</option>
                  <option value="ADMIN">Administrador General (ADMIN)</option>
                  <option value="CLIENT">Cliente (CLIENT)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#062D3A] mb-1">Contraseña Inicial (Opcional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Por defecto: Temporal2026!"
                  className="w-full px-3 py-2 border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E8ECEF] rounded-lg text-[#56696D] hover:bg-[#F8FAFC] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#7AC143] hover:bg-[#68A635] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

