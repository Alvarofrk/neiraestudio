
import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import { User } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const loadedUsers = await api.apiGetUsers();
      console.log('Usuarios cargados:', loadedUsers);
      // Si loadedUsers es un array (incluso vacío), está bien
      if (Array.isArray(loadedUsers)) {
        setUsers(loadedUsers);
      } else {
        // Si no es un array, establecer array vacío
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      const errorMessage = error?.message || 'Error al cargar usuarios';
      
      // Solo mostrar alerta si es un error real (no un array vacío)
      if (errorMessage.includes('403') || errorMessage.includes('permission') || errorMessage.includes('permisos')) {
        alert('No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.');
      } else if (!errorMessage.includes('200') && !errorMessage.includes('OK')) {
        // Solo mostrar error si no es un código 200
        alert(`Error al cargar usuarios: ${errorMessage}`);
      }
      // Si hay error pero es menor, establecer array vacío
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      alert('Por favor, completa todos los campos');
      return;
    }
    if (newUser.password.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    try {
      setLoading(true);
      console.log('Intentando crear usuario:', newUser);
      const created = await api.apiCreateUser({
        username: newUser.username,
        password: newUser.password,
        isAdmin: newUser.isAdmin,
      });
      console.log('Usuario creado exitosamente:', created);
      setUsers([...users, created]);
      setNewUser({ username: '', password: '', isAdmin: false });
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      const errorMessage = error?.message || 'Error al crear el usuario. Por favor, intenta nuevamente.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string | number) => {
    const idStr = String(id);
    if (idStr === '1' || idStr === 'admin') {
      alert('No se puede eliminar el administrador principal');
      return;
    }
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      setLoading(true);
      await api.apiDeleteUser(idStr);
      setUsers(users.filter(u => String(u.id) !== idStr));
      alert('Usuario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      alert(error.message || 'Error al eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <h2 className="text-3xl font-serif font-bold text-slate-900">Gestión de Usuarios</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-3xl font-serif font-bold text-slate-900">Gestión de Usuarios</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nuevo Usuario</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <input className="w-full bg-slate-50 p-3 rounded-xl border-none outline-none font-bold text-sm" placeholder="Usuario" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            <input className="w-full bg-slate-50 p-3 rounded-xl border-none outline-none font-bold text-sm" placeholder="Contraseña" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newUser.isAdmin} onChange={e => setNewUser({...newUser, isAdmin: e.target.checked})} />
              <span className="text-xs font-bold uppercase text-slate-500">Es Administrador</span>
            </label>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all"
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase text-slate-400">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-bold text-sm">{u.username}</td>
                    <td className="px-6 py-4 text-[10px] font-black uppercase text-orange-600">{(u.isAdmin || u.is_admin) ? 'Admin' : 'Usuario'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteUser(u.id)} 
                        disabled={loading || String(u.id) === '1'}
                        className="text-red-400 hover:text-red-600 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title={String(u.id) === '1' ? 'No se puede eliminar el administrador principal' : 'Eliminar usuario'}
                      >
                        ×
                      </button>
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

export default UserManagement;
