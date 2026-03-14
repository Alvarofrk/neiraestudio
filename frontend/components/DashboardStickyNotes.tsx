import React, { useState, useEffect, useCallback } from 'react';
import { UserStickyNote } from '../types';
import * as api from '../services/apiService';

interface DashboardStickyNotesProps {
  /** Datos iniciales desde Dashboard (evita petición separada) */
  initialNotes?: UserStickyNote[];
}

const DashboardStickyNotes: React.FC<DashboardStickyNotesProps> = ({ initialNotes }) => {
  const [notes, setNotes] = useState<UserStickyNote[]>(initialNotes ?? []);
  const [loading, setLoading] = useState(initialNotes === undefined);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formContenido, setFormContenido] = useState('');
  const [formFecha, setFormFecha] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.apiGetStickyNotes();
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
      setLoading(false);
    } else {
      loadNotes();
    }
  }, [initialNotes, loadNotes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const titulo = formTitulo.trim();
    if (!titulo) return;
    try {
      const created = await api.apiCreateStickyNote({
        titulo,
        contenido: formContenido.trim() || '',
        fecha_recordatorio: formFecha || null,
        completada: false,
        orden: 0,
      });
      setNotes((prev) => [...prev, created]);
      setFormTitulo('');
      setFormContenido('');
      setFormFecha('');
      setAdding(false);
    } catch (err) {
      console.error(err);
      loadNotes();
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.apiToggleStickyNote(id);
      setNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? updated : n)));
    } catch (err) {
      console.error(err);
      loadNotes();
    }
  };

  const handleUpdate = async (id: string, titulo: string, contenido: string, fecha: string) => {
    try {
      const updated = await api.apiUpdateStickyNote(id, {
        titulo,
        contenido: contenido || '',
        fecha_recordatorio: fecha || null,
      });
      setNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? updated : n)));
      setEditId(null);
    } catch (err) {
      console.error(err);
      loadNotes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta notita?')) return;
    try {
      await api.apiDeleteStickyNote(id);
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
    } catch (err) {
      console.error(err);
      loadNotes();
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.fecha_recordatorio && b.fecha_recordatorio) {
      return a.fecha_recordatorio.localeCompare(b.fecha_recordatorio);
    }
    if (a.fecha_recordatorio) return -1;
    if (b.fecha_recordatorio) return 1;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
          Mis Notitas / Recordatorios
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[9px] font-black text-orange-600 hover:text-orange-700 uppercase"
          >
            + Nueva
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleCreate} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <input
            type="text"
            value={formTitulo}
            onChange={(e) => setFormTitulo(e.target.value)}
            placeholder="Título"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus
          />
          <textarea
            value={formContenido}
            onChange={(e) => setFormContenido(e.target.value)}
            placeholder="Contenido (opcional)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <input
            type="date"
            value={formFecha}
            onChange={(e) => setFormFecha(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setFormTitulo(''); setFormContenido(''); setFormFecha(''); }}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-8 text-center text-slate-400">
            <span className="animate-spin inline-block rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-bold">Sin notitas aún</p>
            <p className="text-[10px] mt-1">Usa &quot;+ Nueva&quot; para añadir una</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-xl border transition-all ${
                note.completada ? 'bg-slate-50 border-slate-100' : 'bg-amber-50/50 border-amber-100'
              }`}
            >
              {editId === note.id ? (
                <StickyNoteEditForm
                  note={note}
                  onSave={(t, c, f) => handleUpdate(note.id, t, c, f)}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => handleToggle(note.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      note.completada ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-orange-400'
                    }`}
                  >
                    {note.completada && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${note.completada ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {note.titulo}
                    </p>
                    {note.contenido && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{note.contenido}</p>
                    )}
                    {note.fecha_recordatorio && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{note.fecha_recordatorio}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditId(note.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StickyNoteEditForm: React.FC<{
  note: UserStickyNote;
  onSave: (titulo: string, contenido: string, fecha: string) => void;
  onCancel: () => void;
}> = ({ note, onSave, onCancel }) => {
  const [titulo, setTitulo] = useState(note.titulo);
  const [contenido, setContenido] = useState(note.contenido || '');
  const [fecha, setFecha] = useState(note.fecha_recordatorio || '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(titulo.trim(), contenido, fecha);
      }}
      className="space-y-2"
    >
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
        autoFocus
      />
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={2}
        className="w-full px-2 py-1 text-sm border border-slate-200 rounded resize-none"
      />
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
      <div className="flex gap-2 mt-2">
        <button type="submit" className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1 border border-slate-200 text-xs font-bold rounded">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default DashboardStickyNotes;
