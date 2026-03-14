import React, { useState, useEffect } from 'react';
import { CalendarEventPersonal, LawCase } from '../types';
import * as api from '../services/apiService';

interface CalendarEventFormModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
  editEvent?: CalendarEventPersonal | null;
  onSaved: () => void;
  /** Expedientes para selector (evita petición si ya están cargados) */
  casesProp?: LawCase[];
}

const TIPOS = ['Reunión', 'Cita', 'Recordatorio', 'Otro'];

const CalendarEventFormModal: React.FC<CalendarEventFormModalProps> = ({
  open,
  onClose,
  initialDate,
  editEvent,
  onSaved,
  casesProp = [],
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState('');
  const [casoId, setCasoId] = useState<string>('');
  const [cases, setCases] = useState<LawCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editEvent;
  const casesToUse = casesProp.length > 0 ? casesProp : cases;

  useEffect(() => {
    if (open) {
      setTitulo(editEvent?.titulo ?? '');
      setDescripcion(editEvent?.descripcion ?? '');
      setFecha(editEvent?.fecha ?? initialDate ?? '');
      setHora(editEvent?.hora ? String(editEvent.hora).slice(0, 5) : '');
      setTipo(editEvent?.tipo ?? '');
      setCasoId(editEvent?.case?.id ? String(editEvent.case.id) : '');
      setError(null);
      if (casesProp.length > 0) {
        setCases([]);
      } else if (cases.length === 0) {
        setLoadingCases(true);
        api.apiGetCases({}, 1)
          .then((r) => setCases(r.results ?? []))
          .catch(() => setCases([]))
          .finally(() => setLoadingCases(false));
      }
    }
  }, [open, editEvent, initialDate, casesProp.length, cases.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) {
      setError('El título es obligatorio');
      return;
    }
    if (!fecha) {
      setError('La fecha es obligatoria');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        titulo: t,
        descripcion: descripcion.trim() || '',
        fecha,
        hora: hora || null,
        tipo: tipo.trim() || '',
        caso: casoId ? Number(casoId) : null,
      };
      if (isEdit && editEvent) {
        await api.apiUpdateCalendarEvent(String(editEvent.id), payload);
      } else {
        await api.apiCreateCalendarEvent(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-emerald-50 border-b border-slate-100">
          <h2 id="event-form-title" className="text-lg font-black text-slate-900">
            {isEdit ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Agenda personal</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Ej: Reunión con cliente"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">— Seleccionar —</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Expediente (opcional)</label>
            <select
              value={casoId}
              onChange={(e) => setCasoId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              disabled={loadingCases && casesToUse.length === 0}
            >
              <option value="">— Ninguno —</option>
              {loadingCases && casesToUse.length === 0 ? (
                <option value="">Cargando expedientes...</option>
              ) : (
                casesToUse.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo_interno} – {c.caratula}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEventFormModal;
