import React, { useState } from 'react';
import type { SystemUser } from '../../types';

interface OperatorAssignSelectorProps {
  currentOperatorName?: string | null;
  operators: SystemUser[];
  isAssigning?: boolean;
  onAssign: (operatorId: string) => Promise<void>;
}

export const OperatorAssignSelector: React.FC<OperatorAssignSelectorProps> = ({
  currentOperatorName,
  operators,
  isAssigning = false,
  onAssign,
}) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const activeOperators = operators.filter(
    (u) => (u.RoleCode || '').toUpperCase() === 'OPERATOR' && u.IsActive !== false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperatorId) {
      setFeedback({ message: 'Por favor selecciona un operador para asignar.', type: 'error' });
      return;
    }
    setFeedback(null);
    try {
      await onAssign(selectedOperatorId);
      setFeedback({ message: '✓ Operador asignado correctamente.', type: 'success' });
      setSelectedOperatorId('');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al asignar operador';
      setFeedback({ message: msg, type: 'error' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-[#F8FAFC] border border-[#E8ECEF] rounded-xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="operatorAssignSelect"
          className="text-xs font-bold text-[#062D3A] flex items-center gap-1.5"
        >
          <span>👷‍♂️</span>
          <span>Asignación de Especialista / Operador (Admin)</span>
        </label>
        <span className="text-[11px] text-[#56696D]">
          Asignado: <strong>{currentOperatorName || 'Sin asignar'}</strong>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          id="operatorAssignSelect"
          value={selectedOperatorId}
          onChange={(e) => {
            setSelectedOperatorId(e.target.value);
            setFeedback(null);
          }}
          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] font-medium text-[#062D3A]"
        >
          <option value="">-- Seleccionar operador especialista --</option>
          {activeOperators.map((op) => (
            <option key={op.UserId} value={op.UserId}>
              {op.FullName} ({op.Email})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isAssigning || !selectedOperatorId}
          className="px-4 py-2 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isAssigning ? 'Asignando...' : 'Asignar Especialista'}
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
    </form>
  );
};

