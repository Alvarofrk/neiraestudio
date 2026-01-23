import { LawCase, User, CaseActuacion, CaseAlerta, CaseNote } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Utilidades para manejar tokens JWT
const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

const removeTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
};

// Función para hacer peticiones con autenticación
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expirado, intentar refresh
    const refreshed = await refreshToken();
    if (refreshed) {
      // Reintentar la petición con el nuevo token
      const newToken = getToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`Error ${retryResponse.status}: ${retryResponse.statusText}`);
        }
        return retryResponse.json();
      }
    }
    // Si el refresh falla, hacer logout
    removeTokens();
    window.location.href = '/';
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    // Intentar obtener el mensaje de error del JSON
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.error || response.statusText;
    } catch {
      // Si no se puede parsear JSON, usar el statusText
    }
    
    // Para errores 403, mensaje más específico
    if (response.status === 403) {
      throw new Error('No tienes permisos de administrador para acceder a esta sección');
    }
    
    throw new Error(errorMessage || `Error ${response.status}: ${response.statusText}`);
  }

  // Si la respuesta está vacía (204 No Content), retornar null
  if (response.status === 204) {
    return null as T;
  }

  // Intentar parsear JSON, si falla retornar texto vacío
  try {
    const text = await response.text();
    if (!text) {
      return null as T;
    }
    return JSON.parse(text);
  } catch (error) {
    // Si no es JSON válido, retornar el texto como string
    return response.text() as unknown as T;
  }
};

// Refresh token
const refreshToken = async (): Promise<boolean> => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access, refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ============ AUTENTICACIÓN ============
export const apiLogin = async (username: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Credenciales incorrectas' }));
    throw new Error(error.detail || 'Credenciales incorrectas');
  }

  const data = await response.json();
  console.log('Respuesta del login:', data);
  setTokens(data.access, data.refresh);
  // Normalizar el usuario: convertir is_admin a isAdmin y asegurar que id sea string
  const normalizedUser: User = {
    ...data.user,
    id: String(data.user.id),
    isAdmin: data.user.is_admin ?? data.user.isAdmin ?? false,
  };
  console.log('Usuario normalizado:', normalizedUser);
  localStorage.setItem('current_user', JSON.stringify(normalizedUser));
  return normalizedUser;
};

export const apiLogout = (): void => {
  removeTokens();
};

export const apiGetCurrentUser = async (): Promise<User | null> => {
  const stored = localStorage.getItem('current_user');
  if (stored) {
    try {
      // Verificar que el token sigue siendo válido
      const userData = await apiRequest<any>('/auth/me/');
      // Normalizar el usuario
      const normalizedUser: User = {
        ...userData,
        id: String(userData.id),
        isAdmin: userData.is_admin ?? userData.isAdmin ?? false,
      };
      localStorage.setItem('current_user', JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch {
      // Token inválido, limpiar
      removeTokens();
      return null;
    }
  }
  return null;
};

// ============ EXPEDIENTES (CASES) ============
export const apiGetCases = async (search?: string, estado?: string): Promise<LawCase[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (estado) params.append('estado', estado);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await apiRequest<any>(`/cases/${query}`);
  // Asegurar que siempre devolvamos un array
  return Array.isArray(result) ? result : (result.results || result.data || []);
};

export const apiGetCase = async (id: string): Promise<LawCase> => {
  return apiRequest<LawCase>(`/cases/${id}/`);
};

export const apiCreateCase = async (
  caseData: Omit<LawCase, 'id' | 'codigo_interno' | 'updatedAt' | 'actuaciones' | 'alertas' | 'notas' | 'createdBy' | 'lastModifiedBy' | 'created_at' | 'updated_at'>
): Promise<LawCase> => {
  return apiRequest<LawCase>('/cases/', {
    method: 'POST',
    body: JSON.stringify(caseData),
  });
};

export const apiUpdateCase = async (id: string, caseData: Partial<LawCase>): Promise<LawCase> => {
  return apiRequest<LawCase>(`/cases/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(caseData),
  });
};

export const apiDeleteCase = async (id: string): Promise<void> => {
  await apiRequest(`/cases/${id}/`, {
    method: 'DELETE',
  });
};

// ============ ACTUACIONES ============
export const apiCreateActuacion = async (
  casoId: string,
  actuacion: Omit<CaseActuacion, 'id' | 'caso' | 'caso_id' | 'created_at' | 'created_by' | 'created_by_username'>
): Promise<CaseActuacion> => {
  return apiRequest<CaseActuacion>(`/cases/${casoId}/add_actuacion/`, {
    method: 'POST',
    body: JSON.stringify(actuacion),
  });
};

export const apiUpdateActuacion = async (id: string, actuacion: Partial<CaseActuacion>): Promise<CaseActuacion> => {
  return apiRequest<CaseActuacion>(`/actuaciones/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(actuacion),
  });
};

export const apiDeleteActuacion = async (id: string): Promise<void> => {
  await apiRequest(`/actuaciones/${id}/`, {
    method: 'DELETE',
  });
};

// ============ ALERTAS ============
export const apiCreateAlerta = async (
  casoId: string,
  alerta: Omit<CaseAlerta, 'id' | 'caso' | 'caso_id' | 'created_at' | 'created_by' | 'created_by_username' | 'completed_at' | 'completed_by' | 'completed_by_username'>
): Promise<CaseAlerta> => {
  return apiRequest<CaseAlerta>(`/cases/${casoId}/add_alerta/`, {
    method: 'POST',
    body: JSON.stringify(alerta),
  });
};

export const apiUpdateAlerta = async (id: string, alerta: Partial<CaseAlerta>): Promise<CaseAlerta> => {
  return apiRequest<CaseAlerta>(`/alertas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(alerta),
  });
};

export const apiToggleAlerta = async (id: string): Promise<CaseAlerta> => {
  return apiRequest<CaseAlerta>(`/alertas/${id}/toggle_cumplida/`, {
    method: 'POST',
  });
};

export const apiDeleteAlerta = async (id: string): Promise<void> => {
  await apiRequest(`/alertas/${id}/`, {
    method: 'DELETE',
  });
};

// ============ NOTAS ============
export const apiCreateNote = async (
  casoId: string,
  note: Omit<CaseNote, 'id' | 'caso' | 'caso_id' | 'created_at' | 'created_by' | 'created_by_username'>
): Promise<CaseNote> => {
  return apiRequest<CaseNote>(`/cases/${casoId}/add_note/`, {
    method: 'POST',
    body: JSON.stringify(note),
  });
};

export const apiUpdateNote = async (id: string, note: Partial<CaseNote>): Promise<CaseNote> => {
  return apiRequest<CaseNote>(`/notas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(note),
  });
};

export const apiDeleteNote = async (id: string): Promise<void> => {
  await apiRequest(`/notas/${id}/`, {
    method: 'DELETE',
  });
};

// ============ USUARIOS ============
export const apiGetUsers = async (): Promise<User[]> => {
  const users = await apiRequest<any[]>('/users/');
  console.log('Respuesta de apiGetUsers:', users);
  // Si la respuesta es un array (vacío o con datos), está bien
  if (Array.isArray(users)) {
    return users.map(user => ({
      ...user,
      id: String(user.id),
      isAdmin: user.is_admin ?? user.isAdmin ?? false,
    }));
  }
  // Si no es un array, retornar array vacío (no lanzar error)
  return [];
};

export const apiCreateUser = async (user: Omit<User, 'id'> & { password: string }): Promise<User> => {
  try {
    console.log('Creando usuario con datos:', { ...user, is_admin: user.isAdmin ?? user.is_admin ?? false });
    const created = await apiRequest<any>('/users/', {
      method: 'POST',
      body: JSON.stringify({
        username: user.username,
        password: user.password,
        is_admin: user.isAdmin ?? user.is_admin ?? false,
      }),
    });
    console.log('Usuario creado:', created);
    return {
      ...created,
      id: String(created.id),
      isAdmin: created.is_admin ?? created.isAdmin ?? false,
    };
  } catch (error: any) {
    console.error('Error en apiCreateUser:', error);
    throw error;
  }
};

export const apiDeleteUser = async (id: string): Promise<void> => {
  await apiRequest(`/users/${id}/`, {
    method: 'DELETE',
  });
};

// ============ DASHBOARD ============
export const apiGetDashboard = async (): Promise<{
  stats: {
    total_cases: number;
    open_cases: number;
    in_progress_cases: number;
    paused_cases: number;
    closed_cases: number;
  };
  recent_cases: LawCase[];
  alertas: CaseAlerta[];
}> => {
  return apiRequest('/dashboard/');
};
