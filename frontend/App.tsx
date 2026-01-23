
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CaseList from './components/CaseList';
import CaseForm from './components/CaseForm';
import CaseDetail from './components/CaseDetail';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import { LawCase, ViewState, User } from './types';
import * as api from './services/apiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [cases, setCases] = useState<LawCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<LawCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario autenticado al cargar
    const initUser = async () => {
      try {
        const user = await api.apiGetCurrentUser();
        setCurrentUser(user);
        if (user) {
          await loadCases();
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, []);

  const loadCases = async () => {
    try {
      const loadedCases = await api.apiGetCases();
      console.log('Casos cargados:', loadedCases);
      // Asegurar que siempre sea un array
      setCases(Array.isArray(loadedCases) ? loadedCases : []);
    } catch (error) {
      console.error('Error al cargar casos:', error);
      setCases([]); // En caso de error, establecer array vacío
    }
  };

  const handleLogin = async (user: User) => {
    console.log('handleLogin llamado con usuario:', user);
    setCurrentUser(user);
    setCurrentView('dashboard');
    try {
      await loadCases();
    } catch (error) {
      console.error('Error al cargar casos después del login:', error);
    }
  };

  const handleLogout = () => {
    api.apiLogout();
    setCurrentUser(null);
    setCases([]);
    setSelectedCase(null);
  };

  const handleAddCase = async (newCaseData: Omit<LawCase, 'id' | 'codigo_interno' | 'updatedAt' | 'actuaciones' | 'alertas' | 'notas' | 'createdBy' | 'lastModifiedBy' | 'created_at' | 'updated_at'>) => {
    try {
      await api.apiCreateCase(newCaseData);
      await loadCases();
      setCurrentView('cases');
    } catch (error) {
      console.error('Error al crear caso:', error);
      alert('Error al crear el expediente. Por favor, intenta nuevamente.');
    }
  };

  const handleUpdateCase = async (updatedCase: LawCase) => {
    try {
      const updated = await api.apiUpdateCase(String(updatedCase.id), updatedCase);
      await loadCases();
      if (selectedCase && String(selectedCase.id) === String(updatedCase.id)) {
        setSelectedCase(updated);
      }
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      alert('Error al actualizar el expediente. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteCase = async (id: string | number) => {
    try {
      await api.apiDeleteCase(String(id));
      await loadCases();
      setCurrentView('cases');
      setSelectedCase(null);
    } catch (error) {
      console.error('Error al eliminar caso:', error);
      alert('Error al eliminar el expediente. Por favor, intenta nuevamente.');
    }
  };

  const navigateToCase = async (lawCase: LawCase) => {
    try {
      // Cargar el caso completo desde la API
      const fullCase = await api.apiGetCase(String(lawCase.id));
      setSelectedCase(fullCase);
      setCurrentView('case-detail');
    } catch (error) {
      console.error('Error al cargar caso:', error);
      // Si falla, usar el caso que ya tenemos
      setSelectedCase(lawCase);
      setCurrentView('case-detail');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard cases={cases} onViewChange={setCurrentView} onSelectCase={navigateToCase} onUpdateCase={handleUpdateCase} />;
      case 'cases':
        return <CaseList cases={cases} onSelectCase={navigateToCase} onViewChange={setCurrentView} />;
      case 'new-case':
        return <CaseForm onAdd={handleAddCase} onCancel={() => setCurrentView('cases')} />;
      case 'case-detail':
        return selectedCase ? (
          <CaseDetail 
            lawCase={selectedCase} 
            onUpdate={handleUpdateCase} 
            onBack={() => setCurrentView('cases')}
            onDelete={handleDeleteCase}
          />
        ) : <CaseList cases={cases} onSelectCase={navigateToCase} onViewChange={setCurrentView} />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard cases={cases} onViewChange={setCurrentView} onSelectCase={navigateToCase} onUpdateCase={handleUpdateCase} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      onLogout={handleLogout}
      currentUser={currentUser}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
