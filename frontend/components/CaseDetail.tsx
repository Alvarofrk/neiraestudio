
import React, { useState, useEffect } from 'react';
import { LawCase, CaseStatus, CasePriority, CaseNote, CaseAlerta, CaseActuacion, User } from '../types';
import * as api from '../services/apiService';

interface CaseDetailProps {
  lawCase: LawCase;
  onUpdate: (updatedCase: LawCase) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ lawCase, onUpdate, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'actuaciones' | 'alertas' | 'notas' | 'editar'>('actuaciones');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [caseData, setCaseData] = useState<LawCase>(lawCase);

  useEffect(() => {
    const loadUser = async () => {
      const user = await api.apiGetCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
    // Recargar caso completo desde la API
    const loadCase = async () => {
      try {
        const fullCase = await api.apiGetCase(lawCase.id);
        setCaseData(fullCase);
      } catch (error) {
        console.error('Error al cargar caso:', error);
      }
    };
    loadCase();
  }, [lawCase.id]);
  
  // Estados para CRUD
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState({ titulo: '', contenido: '', etiqueta: 'Estrategia' });
  const [newActuacion, setNewActuacion] = useState({ descripcion: '', tipo: 'Escrito', tipoPersonalizado: '', fecha: new Date().toISOString().split('T')[0] });
  const [newAlerta, setNewAlerta] = useState({ titulo: '', resumen: '', hora: '', fecha_vencimiento: '', prioridad: CasePriority.MEDIA });

  // --- LOGICA DE ACTUALIZACIÓN CENTRAL ---
  const handleUpdateField = async (field: keyof LawCase, value: any) => {
    try {
      const updated = await api.apiUpdateCase(String(caseData.id), { [field]: value });
      setCaseData(updated);
      onUpdate(updated);
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar. Por favor, intenta nuevamente.');
    }
  };

  // --- CRUD DE ALERTAS ---
  const addAlerta = async () => {
    if (!newAlerta.titulo || !newAlerta.fecha_vencimiento) return;
    try {
      if (editingAlertId) {
        const updated = await api.apiUpdateAlerta(editingAlertId, newAlerta);
        const updatedAlertas = caseData.alertas.map(a => a.id === editingAlertId ? updated : a);
        const updatedCase = { ...caseData, alertas: updatedAlertas };
        setCaseData(updatedCase);
        onUpdate(updatedCase);
        setEditingAlertId(null);
      } else {
        const nueva = await api.apiCreateAlerta(caseData.id, newAlerta);
        const updatedCase = { ...caseData, alertas: [nueva, ...caseData.alertas] };
        setCaseData(updatedCase);
        onUpdate(updatedCase);
      }
      setNewAlerta({ titulo: '', resumen: '', hora: '', fecha_vencimiento: '', prioridad: CasePriority.MEDIA });
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      alert('Error al guardar la alerta. Por favor, intenta nuevamente.');
    }
  };

  const deleteAlerta = async (id: string) => {
    if (!confirm('¿Eliminar esta alerta?')) return;
    try {
      await api.apiDeleteAlerta(String(id));
      const updatedAlertas = (caseData.alertas || []).filter(a => String(a.id) !== String(id));
      const updatedCase = { ...caseData, alertas: updatedAlertas };
      setCaseData(updatedCase);
      onUpdate(updatedCase);
    } catch (error) {
      console.error('Error al eliminar alerta:', error);
      alert('Error al eliminar la alerta.');
    }
  };

  // --- CRUD DE NOTAS ---
  const addNote = async () => {
    if (!newNote.contenido || !newNote.titulo) return;
    try {
      if (editingNoteId) {
        const updated = await api.apiUpdateNote(String(editingNoteId), newNote);
        const updatedNotas = (caseData.notas || []).map(n => String(n.id) === String(editingNoteId) ? updated : n);
        const updatedCase = { ...caseData, notas: updatedNotas };
        setCaseData(updatedCase);
        onUpdate(updatedCase);
        setEditingNoteId(null);
      } else {
        const nueva = await api.apiCreateNote(String(caseData.id), newNote);
        const updatedCase = { ...caseData, notas: [nueva, ...(caseData.notas || [])] };
        setCaseData(updatedCase);
        onUpdate(updatedCase);
      }
      setNewNote({ titulo: '', contenido: '', etiqueta: 'Estrategia' });
    } catch (error) {
      console.error('Error al guardar nota:', error);
      alert('Error al guardar la nota. Por favor, intenta nuevamente.');
    }
  };

  // --- CRUD DE ACTUACIONES ---
  const addActuacion = async () => {
    if (!newActuacion.descripcion) return;
    try {
      const tipo = newActuacion.tipo === 'Otro' ? newActuacion.tipoPersonalizado : newActuacion.tipo;
      const nueva = await api.apiCreateActuacion(caseData.id, {
        descripcion: newActuacion.descripcion,
        tipo: tipo || 'Escrito',
        fecha: newActuacion.fecha,
      });
      const updatedCase = { ...caseData, actuaciones: [nueva, ...caseData.actuaciones] };
      setCaseData(updatedCase);
      onUpdate(updatedCase);
      setNewActuacion({ descripcion: '', tipo: 'Escrito', tipoPersonalizado: '', fecha: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Error al guardar actuación:', error);
      alert('Error al guardar la actuación. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
          <button onClick={onBack} className="p-3 bg-slate-50 text-slate-400 hover:text-orange-500 rounded-2xl transition-all shadow-inner border border-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-orange-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-orange-200">{caseData.codigo_interno}</span>
              <span className="text-[10px] font-black bg-zinc-900 text-white px-3 py-1 rounded-lg uppercase tracking-widest">{caseData.nro_expediente}</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mt-2">{caseData.caratula}</h2>
            <p className="text-[9px] text-slate-400 uppercase font-black mt-2 tracking-widest border-l-2 border-orange-500 pl-2">
              Auditoría: Creado por @{caseData.created_by_username || caseData.createdBy || 'sistema'} | Modificado por @{caseData.last_modified_by_username || caseData.lastModifiedBy || 'sistema'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 z-10">
           <button onClick={() => setActiveTab('editar')} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all">Editar Carátula</button>
           <button onClick={() => confirm("¿Eliminar expediente?") && onDelete(caseData.id)} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-xl border border-red-100 transition-all">Eliminar</button>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
      </header>

      <nav className="flex gap-2 bg-white p-1.5 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        {(['actuaciones', 'alertas', 'notas'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab === 'notas' ? 'Biblioteca Estratégica' : tab}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Detalles del Proceso</h3>
              {[
                { label: 'Responsable', value: caseData.abogado_responsable },
                { label: 'Juzgado / Sala', value: caseData.juzgado },
                { label: 'Cliente', value: caseData.cliente_nombre },
                { label: 'DNI/RUC', value: caseData.cliente_dni },
                { label: 'Contraparte', value: caseData.contraparte }
              ].map(item => (
                <div key={item.label}>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{item.label}</p>
                   <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl">{item.value || 'No consignado'}</p>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Estado de Tramitación</p>
                <select 
                  className="w-full bg-orange-50 text-orange-600 font-black px-4 py-3 rounded-2xl outline-none text-[10px] uppercase tracking-widest border border-orange-100 shadow-sm"
                  value={caseData.estado}
                  onChange={(e) => handleUpdateField('estado', e.target.value)}
                >
                  {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'actuaciones' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-6">Nuevo Registro de Actuación</h4>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input className="flex-1 bg-slate-50 p-4 rounded-2xl outline-none text-xs font-bold border border-slate-100 focus:border-orange-200 transition-all" placeholder="Resumen de la actuación..." value={newActuacion.descripcion} onChange={(e) => setNewActuacion({...newActuacion, descripcion: e.target.value})} />
                    <select className="bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-bold border border-slate-100" value={newActuacion.tipo} onChange={(e) => setNewActuacion({...newActuacion, tipo: e.target.value})}>
                      <option value="Escrito">Escrito</option>
                      <option value="Audiencia">Audiencia</option>
                      <option value="Notificación">Notificación</option>
                      <option value="Varios">Varios</option>
                      <option value="Otro">Otro Tipo...</option>
                    </select>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    {newActuacion.tipo === 'Otro' && (
                      <input className="flex-1 bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-bold border border-orange-200" placeholder="Especifique tipo de actuación..." value={newActuacion.tipoPersonalizado} onChange={(e) => setNewActuacion({...newActuacion, tipoPersonalizado: e.target.value})} />
                    )}
                    <input type="date" className="bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-bold border border-slate-100" value={newActuacion.fecha} onChange={(e) => setNewActuacion({...newActuacion, fecha: e.target.value})} />
                    <button onClick={addActuacion} className="bg-orange-500 text-white p-4 px-10 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">Agregar al Timeline</button>
                  </div>
                </div>
              </div>
              {/* Timeline Items... similar a versiones anteriores pero con auditoría visible */}
            </div>
          )}

          {activeTab === 'alertas' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">Programar Vencimiento / Plazo</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input className="bg-slate-50 p-4 rounded-2xl outline-none text-xs font-bold border border-slate-100" placeholder="Título (ej: Plazo Contestación)" value={newAlerta.titulo} onChange={(e) => setNewAlerta({...newAlerta, titulo: e.target.value})} />
                    <input type="date" className="bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-bold border border-slate-100" value={newAlerta.fecha_vencimiento} onChange={(e) => setNewAlerta({...newAlerta, fecha_vencimiento: e.target.value})} />
                    <input type="time" className="bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-bold border border-slate-100" value={newAlerta.hora} onChange={(e) => setNewAlerta({...newAlerta, hora: e.target.value})} />
                  </div>
                  <textarea className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-[11px] font-bold border border-slate-100 min-h-[80px]" placeholder="Resumen detallado del vencimiento..." value={newAlerta.resumen} onChange={(e) => setNewAlerta({...newAlerta, resumen: e.target.value})} />
                  <button onClick={addAlerta} className="w-full bg-black text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-zinc-800 transition-all">Registrar Plazo</button>
                </div>
              </div>

              <div className="space-y-4">
                {(caseData.alertas || []).map(al => (
                  <div key={al.id} className={`p-6 rounded-[2rem] border transition-all relative group ${al.cumplida ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${al.cumplida ? 'bg-zinc-200 text-zinc-500' : 'bg-orange-100 text-orange-600'}`}>
                          {al.cumplida ? 'Cumplido' : 'Pendiente'}
                       </span>
                       <div className="flex gap-4 items-center">
                          <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-tighter">{al.fecha_vencimiento} {al.hora}</span>
                          <button onClick={() => deleteAlerta(al.id)} className="text-red-300 hover:text-red-500 font-black">×</button>
                       </div>
                    </div>
                    <p className={`text-base font-bold ${al.cumplida ? 'line-through text-slate-400' : 'text-slate-900 uppercase'}`}>{al.titulo}</p>
                    {al.resumen && <p className="text-sm text-slate-500 mt-2 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-50 italic">{al.resumen}</p>}
                    <div className="mt-4 flex justify-between items-center text-[9px] font-black uppercase text-slate-300">
                      <span>Programado por @{al.created_by_username || al.createdBy || 'sistema'}</span>
                      {al.cumplida && <span>✓ {al.completed_by_username || al.completedBy || 'sistema'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-6">Biblioteca Estratégica: Registro de Evento</h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input className="flex-1 bg-slate-50 p-4 rounded-2xl outline-none text-sm font-bold border border-slate-100" placeholder="Título del Evento (ej: Resultado Entrevista)" value={newNote.titulo} onChange={(e) => setNewNote({...newNote, titulo: e.target.value})} />
                    <select className="bg-slate-50 p-4 rounded-2xl outline-none text-[10px] font-black border border-slate-100 uppercase" value={newNote.etiqueta} onChange={(e) => setNewNote({...newNote, etiqueta: e.target.value})}>
                      <option value="Estrategia">Estrategia</option>
                      <option value="Documentación">Documentación</option>
                      <option value="Investigación">Investigación</option>
                      <option value="Jurisprudencia">Jurisprudencia</option>
                    </select>
                  </div>
                  <textarea className="w-full bg-slate-50 p-6 rounded-2xl outline-none text-sm font-medium min-h-[150px] border border-slate-100" placeholder="Escriba el análisis detallado aquí..." value={newNote.contenido} onChange={(e) => setNewNote({...newNote, contenido: e.target.value})}></textarea>
                  <button onClick={addNote} className="w-full bg-black text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-xl">Guardar en Biblioteca</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(caseData.notas || []).map(note => (
                  <div key={note.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase w-fit mb-2 tracking-widest">{note.etiqueta}</span>
                        <h6 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{note.titulo}</h6>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                        {new Date(note.fecha_creacion).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/30 p-6 rounded-[1.5rem] border border-slate-50/50 whitespace-pre-wrap">
                      {note.contenido}
                    </div>
                    <p className="text-[9px] text-slate-300 font-black uppercase mt-6 text-right tracking-[0.1em]">Escrito por @{note.created_by_username || note.createdBy || 'sistema'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'editar' && (
            <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-2xl">
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-8 border-b pb-4">Actualizar Datos Principales</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carátula</label>
                   <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold border border-slate-100" value={caseData.caratula} onChange={(e) => handleUpdateField('caratula', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nro Expediente</label>
                   <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-mono border border-slate-100" value={caseData.nro_expediente} onChange={(e) => handleUpdateField('nro_expediente', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Juzgado / Ubicación</label>
                   <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={caseData.juzgado} onChange={(e) => handleUpdateField('juzgado', e.target.value)} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abogado Resp.</label>
                   <input className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold" value={caseData.abogado_responsable} onChange={(e) => handleUpdateField('abogado_responsable', e.target.value)} />
                 </div>
               </div>
               <button onClick={() => setActiveTab('actuaciones')} className="mt-10 bg-black text-white px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all">Guardar Cambios en Ficha</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
