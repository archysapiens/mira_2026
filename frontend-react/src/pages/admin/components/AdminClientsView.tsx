import React, { useState } from 'react';
import type { ServiceRequest, SystemUser } from '../../../types';
import { formatDate } from '../../../utils/formatters';

interface AdminClientsViewProps {
  requests: ServiceRequest[];
  users: SystemUser[];
}

interface ClientRecord {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  totalQuotes: number;
  lastQuoteDate: string;
  status: 'Activo' | 'En seguimiento' | 'Potencial';
}

export const AdminClientsView: React.FC<AdminClientsViewProps> = ({ requests }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupar clientes a partir de las solicitudes
  const clientsMap = new Map<string, ClientRecord>();

  requests.forEach((req) => {
    const key = (req.Email || req.ContactName || 'cliente-general').toLowerCase();
    const existing = clientsMap.get(key);

    if (existing) {
      existing.totalQuotes += 1;
      if (new Date(req.CreatedAt) > new Date(existing.lastQuoteDate)) {
        existing.lastQuoteDate = req.CreatedAt;
      }
    } else {
      clientsMap.set(key, {
        id: `cli-${clientsMap.size + 1}`,
        name: req.ContactName || 'Contacto Industrial',
        company: req.Company || 'Persona Física / Particular',
        email: req.Email || 'contacto@empresa.com',
        phone: req.Phone || '55 5123 4567',
        location: req.Location || 'Cobertura Nacional',
        totalQuotes: 1,
        lastQuoteDate: req.CreatedAt,
        status: req.Status === 'T' ? 'Activo' : 'En seguimiento',
      });
    }
  });

  const clientsList = Array.from(clientsMap.values()).filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062D3A] text-white text-xs">🏢</span>
            <h2 className="text-xl sm:text-2xl font-black text-[#062D3A] tracking-tight">
              Cartera de Clientes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#56696D] mt-1">
            Directorio corporativo y seguimiento de cuentas que cotizan servicios con MIRA.
          </p>
        </div>

        <div className="text-xs text-[#56696D] bg-[#F8FAFC] px-3.5 py-2 rounded-lg border border-[#E8ECEF] font-bold">
          Total Clientes Registrados: <span className="text-[#062D3A]">{clientsMap.size}</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl p-4 shadow-xs flex items-center gap-3">
        <span className="text-sm text-[#8E9FA2]">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente, empresa, correo o ubicación..."
          className="w-full text-xs bg-transparent focus:outline-none text-[#062D3A]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-[#8E9FA2] hover:text-[#062D3A] cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white border border-[#E8ECEF] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E8ECEF] text-[11px] font-bold text-[#56696D] uppercase tracking-wider">
                <th className="py-3 px-4">Empresa / Razón Social</th>
                <th className="py-3 px-4">Contacto Principal</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4 text-center">Cotizaciones</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECEF] text-xs">
              {clientsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8E9FA2] italic">
                    No se encontraron clientes con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                clientsList.map((client) => (
                  <tr key={client.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#062D3A]">
                      {client.company}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#56696D]">
                      {client.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#062D3A]">
                      {client.email}
                    </td>
                    <td className="py-3.5 px-4 text-[#8E9FA2] truncate max-w-[200px]">
                      📍 {client.location}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#062D3A]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs border border-blue-200">
                        {client.totalQuotes}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#56696D] whitespace-nowrap">
                      {formatDate(client.lastQuoteDate)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

