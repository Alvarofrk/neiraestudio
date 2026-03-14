
import React, { useState, useEffect } from 'react';
import { LawCase, CaseStatus, User } from '../types';
import * as api from '../services/apiService';

// Define the type for case data excluding fields managed by the storage service
type NewCaseInput = Omit<LawCase, 'id' | 'codigo_interno' | 'updatedAt' | 'actuaciones' | 'alertas' | 'notas' | 'createdBy' | 'lastModifiedBy'>;

interface CaseFormProps {
  onAdd: (newCase: NewCaseInput) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const CaseForm: React.FC<CaseFormProps> = ({ onAdd, onCancel, currentUser }) => {
  const [abogados, setAbogados] = useState<{ id: number; username: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    caratula: '',
    nro_expediente: '',
    juzgado: '',
    fuero: 'Civil',
    fueroOtro: '',
    estado: CaseStatus.OPEN,
    abogados_asignados_ids: [] as (string | number)[],
    cliente_nombre: '',
    cliente_dni: '',
    contraparte: ''
  });

  useEffect(() => {
    api.apiGetAssignableUsers().then(setAbogados).catch(() => setAbogados([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.caratula || !formData.nro_expediente) {
      alert("La Carátula y el Nro. de Expediente son campos obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const fueroFinal = formData.fuero === 'Otro' ? (formData.fueroOtro?.trim() || 'Otro') : formData.fuero;
      const { fueroOtro: _omit, ...rest } = formData;
      const newCaseData: NewCaseInput = {
        ...rest,
        fuero: fueroFinal,
        abogados_asignados_ids: formData.abogados_asignados_ids,
        fecha_inicio: new Date().toISOString().split('T')[0]
      };
      await onAdd(newCaseData);
    } catch (error) {
      console.error('Error al crear caso:', error);
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header>
        <h2 className="text-3xl font-serif font-bold text-slate-900">Apertura de Expediente</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Estudio Jurídico Neira Trujillo</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carátula del Proceso *</label>
            <input 
              required
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 font-bold placeholder-slate-300"
              placeholder="Ej: Perez c/ Lopez s/ Daños y Perjuicios"
              value={formData.caratula}
              onChange={(e) => setFormData({...formData, caratula: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nro. Expediente *</label>
            <input 
              required
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono"
              placeholder="123456/2024"
              value={formData.nro_expediente}
              onChange={(e) => setFormData({...formData, nro_expediente: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Juzgado / Sala</label>
            <input 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Ej: Juzgado Civil 1ª Instancia"
              value={formData.juzgado}
              onChange={(e) => setFormData({...formData, juzgado: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraparte</label>
            <input 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Nombre de la contraparte"
              value={formData.contraparte}
              onChange={(e) => setFormData({...formData, contraparte: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Abogados asignados
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1">
              {abogados.length === 0 ? (
                <p className="text-sm text-slate-400">No hay abogados disponibles</p>
              ) : (
                abogados.map((u) => (
                  <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 rounded-lg px-3 py-2 -mx-1 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.abogados_asignados_ids.includes(u.id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...formData.abogados_asignados_ids, u.id]
                          : formData.abogados_asignados_ids.filter((id) => id !== u.id);
                        setFormData({ ...formData, abogados_asignados_ids: ids });
                      }}
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-slate-700">{u.username}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente (Nombre completo)</label>
            <input 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.cliente_nombre}
              onChange={(e) => setFormData({...formData, cliente_nombre: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DNI / CUIT Cliente</label>
            <input 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.cliente_dni}
              onChange={(e) => setFormData({...formData, cliente_dni: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuero / Jurisdicción</label>
            <select 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.fuero}
              onChange={(e) => setFormData({...formData, fuero: e.target.value})}
            >
              <option value="Civil">Civil</option>
              <option value="Comercial">Comercial</option>
              <option value="Penal">Penal</option>
              <option value="Laboral">Laboral</option>
              <option value="Familia">Familia</option>
              <option value="Otro">Otro</option>
            </select>
            {formData.fuero === 'Otro' && (
              <input
                type="text"
                className="w-full mt-2 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-400"
                placeholder="Especificar fuero o jurisdicción"
                value={formData.fueroOtro}
                onChange={(e) => setFormData({...formData, fueroOtro: e.target.value})}
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Inicial</label>
            <select 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.estado}
              onChange={(e) => setFormData({...formData, estado: e.target.value as CaseStatus})}
            >
              {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button 
            type="submit" 
            disabled={submitting || !formData.caratula.trim() || !formData.nro_expediente.trim()}
            className="flex-1 bg-black text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Registrando...
              </>
            ) : (
              'Registrar Caso'
            )}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={submitting}
            className="w-full md:w-1/3 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;
