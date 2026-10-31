import React, { useState } from 'react';
import type { WorkNote } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface WorkNotesSectionProps {
  notes: WorkNote[];
  isLoadingNotes?: boolean;
  canAddNote?: boolean;
  onAddNote?: (noteText: string) => Promise<void>;
}

export const WorkNotesSection: React.FC<WorkNotesSectionProps> = ({
  notes,
  isLoadingNotes = false,
  canAddNote = false,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newNote.trim();
    if (!clean) {
      setFeedback({ message: 'Escribe el contenido de la nota antes de guardar.', type: 'error' });
      return;
    }
    if (!onAddNote) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onAddNote(clean);
      setNewNote('');
      setFeedback({ message: '✓ Nota registrada exitosamente en la bitácora.', type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la nota';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8ECEF] rounded-xl p-5 shadow-xs space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#E8ECEF]">
        <span className="text-[#00875A] text-lg font-bold">📋</span>
        <h4 className="text-sm font-bold text-[#062D3A]">Bitácora de Trabajo Técnica</h4>
      </div>

      {/* Historial de Notas */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {isLoadingNotes ? (
          <div className="p-4 text-center text-xs text-[#8E9FA2] italic">
            Cargando notas de la bitácora...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-4 bg-[#F8FAFC] border border-dashed border-[#E8ECEF] rounded-lg text-center text-xs text-[#8E9FA2] italic">
            No existen notas de trabajo registradas para este servicio aún.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.WorkNoteId}
              className="p-3.5 bg-[#F8FAFC] border border-[#E8ECEF] rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#062D3A] flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>{n.Author || 'Especialista MIRA'}</span>
                </span>
                <span className="text-[11px] text-[#8E9FA2]">
                  {formatDateTime(n.CreatedAt)}
                </span>
              </div>
              <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">
                {n.Note}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Formulario Agregar Nota (solo OPERATOR y ADMIN) */}
      {canAddNote && onAddNote && (
        <form onSubmit={handleSubmit} className="pt-3 border-t border-[#E8ECEF] space-y-3">
          <label
            htmlFor="workNoteInput"
            className="block text-xs font-bold text-[#062D3A]"
          >
            Registrar avance en bitácora
          </label>
          <textarea
            id="workNoteInput"
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Describe los avances, materiales utilizados o diagnóstico técnico en sitio..."
            className="w-full p-3 text-xs bg-white border border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#7AC143] focus:ring-1 focus:ring-[#7AC143] leading-relaxed resize-none"
          />

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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#8E9FA2]">
              Quedará registrado con tu usuario y fecha actual.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7AC143] hover:bg-[#68A635] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 self-end sm:self-auto"
            >
              <span>{isSubmitting ? 'Guardando...' : 'Guardar nota en bitácora'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

