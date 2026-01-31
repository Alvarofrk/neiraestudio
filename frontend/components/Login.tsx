
import React, { useState } from 'react';
import * as api from '../services/apiService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await api.apiLogin(username.trim(), password);
      onLogin(user);
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl animate-fadeIn">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-zinc-950 via-slate-950 to-black shadow-2xl">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Panel marca */}
            <div className="hidden lg:block relative p-12 text-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <span className="font-serif font-black text-lg">
                    <span className="text-orange-400">N</span>T
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-black">Sistema Jurídico</p>
                  <h1 className="text-xl font-serif font-black leading-tight">
                    Neira Trujillo<br />
                    <span className="text-orange-400">Abogados SRL</span>
                  </h1>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  Gestión de expedientes, actuaciones, alertas y notas con control por roles.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Expedientes', desc: 'Histórico y búsqueda avanzada' },
                    { title: 'Alertas', desc: 'Plazos y vencimientos' },
                    { title: 'Calendario', desc: 'Vista de eventos por día' },
                    { title: 'Excel', desc: 'Exportación profesional' },
                  ].map((f) => (
                    <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-black uppercase tracking-widest">{f.title}</p>
                      <p className="mt-1 text-[11px] text-white/60 font-bold">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-10 text-[9px] text-white/40 font-black uppercase tracking-[0.35em]">
                SEDE JULIACA · NT &copy; 2026
              </p>
            </div>

            {/* Panel login */}
            <div className="bg-zinc-950/55 backdrop-blur-xl border-t border-white/10 lg:border-t-0 lg:border-l border-white/10 p-8 sm:p-10 lg:p-12 text-white">
              {/* Header mobile: mostrar marca cuando el panel izquierdo está oculto */}
              <div className="lg:hidden mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center shadow-sm">
                    <span className="font-serif font-black text-base">
                      <span className="text-orange-400">N</span>T
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-black">Neira Trujillo</p>
                    <p className="text-sm font-black text-white">Abogados SRL</p>
                  </div>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-black">Acceso</p>
                  <h2 className="text-3xl font-serif font-black text-white mt-2">Iniciar sesión</h2>
                  <p className="text-sm text-white/70 mt-2 font-medium">
                    Ingresa con tu usuario autorizado para acceder al sistema.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-white/60 uppercase mb-2 tracking-widest">
                      Usuario
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m11-10a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-sm transition-all placeholder-white/40 text-white"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ej: admin"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-white/60 uppercase mb-2 tracking-widest">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-14 py-4 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-sm transition-all placeholder-white/40 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 transition-all"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        disabled={loading}
                      >
                        {showPassword ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      className="bg-red-500/10 text-red-200 p-4 rounded-2xl text-[11px] font-bold border border-red-500/20"
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !username.trim() || !password}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-orange-600 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Ingresando...
                      </>
                    ) : (
                      'Ingresar'
                    )}
                  </button>

                  <div className="pt-2" />
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
