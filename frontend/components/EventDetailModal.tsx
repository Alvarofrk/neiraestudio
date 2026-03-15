import React, { useState, useEffect } from 'react';
import { CalendarEvent, LawCase } from '../types';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onSelectCase: (lawCase: LawCase) => void;
  onToggleAlerta?: (alertaId: string) => Promise<void>;
  onEditPersonalEvent?: (event: CalendarEvent & { kind: 'personal' }) => void;
  onDeletePersonalEvent?: (eventId: string) => Promise<void>;
}

/** Formatea hora HH:MM:SS a HH:MM */
const formatHora = (hora: string | null | undefined): string => {
  if (!hora) return '';
  const parts = String(hora).split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : hora;
};

/** Color por urgencia para alertas */
const getUrgencyClass = (fechaVencimiento: string): string => {
  try {
    const target = new Date(fechaVencimiento);
    if (isNaN(target.getTime())) return 'bg-slate-400';
    const now = new Date();
    const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) return 'bg-red-500';
    if (diffHours < 24) return 'bg-red-400';
    if (diffHours < 72) return 'bg-orange-400';
    return 'bg-blue-400';
  } catch {
    return 'bg-slate-400';
  }
};

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  open,
  onClose,
  onSelectCase,
  onToggleAlerta,
  onEditPersonalEvent,
  onDeletePersonalEvent,
}) => {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open || !event) setConfirmDeleteOpen(false);
  }, [open, event?.id]);

  if (!open) return null;

  const handleIrExpediente = () => {
    if (!event?.case) return;
    const caseObj: LawCase = {
      id: String(event.case.id),
      codigo_interno: event.case.codigo_interno,
      caratula: event.case.caratula,
      nro_expediente: '',
      juzgado: '',
      fuero: '',
      estado: 'Abierto' as any,
      cliente_nombre: '',
      cliente_dni: '',
      contraparte: '',
      fecha_inicio: '',
    };
    onClose();
    onSelectCase(caseObj);
  };

  const handleToggleAlerta = async () => {
    if (event?.kind !== 'alerta' || !onToggleAlerta) return;
    setToggling(true);
    try {
      await onToggleAlerta(String(event.id));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const fecha = event?.kind === 'alerta'
    ? (event.fecha_vencimiento || event.fecha)
    : event?.kind === 'actuacion' || event?.kind === 'personal'
      ? event.fecha
      : '';
  const hora = event?.kind === 'alerta' || event?.kind === 'personal'
    ? formatHora((event as { hora?: string | null }).hora)
    : '';

  const handleDeletePersonal = async () => {
    if (event?.kind !== 'personal' || !onDeletePersonalEvent) return;
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      await onDeletePersonalEvent(String(event.id));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 ${event?.kind === 'alerta' ? 'bg-slate-50' : event?.kind === 'personal' ? 'bg-emerald-50' : 'bg-blue-50'} border-b border-slate-100`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {event?.kind === 'alerta' ? 'Tarea / Alerta' : event?.kind === 'personal' ? 'Evento personal' : 'Actuación'}
              </span>
              <h2 id="event-modal-title" className="text-lg font-black text-slate-900 mt-1 truncate">
                {event?.titulo || 'Sin título'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {fecha}
            </span>
            {hora && (
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                {hora}
              </span>
            )}
          </div>

          {event?.caratula && (
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400">Expediente</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{event.caratula}</p>
              {event.codigo_interno && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">{event.codigo_interno}</p>
              )}
            </div>
          )}

          {event?.kind === 'alerta' && (event.resumen || event.cumplida !== undefined) && (
            <div>
              {event.resumen && (
                <>
                  <span className="text-[10px] font-black uppercase text-slate-400">Resumen</span>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{event.resumen}</p>
                </>
              )}
              {event.cumplida !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[9px] font-black text-white ${getUrgencyClass(event.fecha_vencimiento || event.fecha)}`}>
                    {event.cumplida ? 'Completada' : 'Pendiente'}
                  </span>
                  {event.prioridad && (
                    <span className="text-xs text-slate-500">Prioridad: {event.prioridad}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {(event?.kind === 'actuacion' || event?.kind === 'personal') && (event as { descripcion?: string }).descripcion && (
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400">Descripción</span>
              <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{(event as { descripcion?: string }).descripcion}</p>
            </div>
          )}
          {event?.kind === 'personal' && (event as { tipo?: string }).tipo && (
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400">Tipo</span>
              <p className="text-sm text-slate-700 mt-0.5">{(event as { tipo?: string }).tipo}</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex flex-col sm:flex-row flex-wrap gap-3">
          {event?.case && (
            <button
              onClick={handleIrExpediente}
              className="flex-1 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Ir al expediente
            </button>
          )}
          {event?.kind === 'personal' && onEditPersonalEvent && (
            <button
              onClick={() => { onClose(); onEditPersonalEvent(event as CalendarEvent & { kind: 'personal' }); }}
              className="px-6 py-3 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Editar
            </button>
          )}
          {event?.kind === 'personal' && onDeletePersonalEvent && (
            confirmDeleteOpen ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
                <p className="text-sm text-slate-600 font-medium">¿Eliminar este evento?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(false)}
                    disabled={deleting}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePersonal}
                    disabled={deleting}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Eliminando…
                      </>
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleting}
                className="px-6 py-3 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
              >
                Eliminar
              </button>
            )
          )}
          {event?.kind === 'alerta' && onToggleAlerta && (
            <button
              onClick={handleToggleAlerta}
              disabled={toggling}
              className="px-6 py-3 border border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-700 hover:text-green-700 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {toggling ? '...' : event.cumplida ? 'Reabrir' : 'Marcar cumplida'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
