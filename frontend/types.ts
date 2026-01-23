
export enum CaseStatus {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Trámite',
  PAUSED = 'Pausado',
  CLOSED = 'Cerrado'
}

export enum CasePriority {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja'
}

export interface User {
  id: string | number;
  username: string;
  password?: string;
  isAdmin?: boolean;
  is_admin?: boolean; // Compatibilidad con backend
}

export interface CaseNote {
  id: string;
  caso_id?: string;
  caso?: string;
  titulo: string;
  contenido: string;
  etiqueta: string;
  fecha_creacion?: string;
  created_at?: string;
  createdBy?: string;
  created_by?: string;
  created_by_username?: string;
}

export interface CaseActuacion {
  id: string;
  caso_id?: string;
  caso?: string;
  fecha: string;
  descripcion: string;
  tipo: string;
  createdBy?: string;
  created_by?: string;
  created_by_username?: string;
  created_at?: string;
}

export interface CaseAlerta {
  id: string;
  caso_id?: string;
  caso?: string;
  titulo: string;
  resumen: string;
  hora?: string | null;
  fecha_vencimiento: string;
  cumplida: boolean;
  prioridad: CasePriority;
  createdBy?: string;
  created_by?: string;
  created_by_username?: string;
  completedBy?: string;
  completed_by?: string;
  completed_by_username?: string;
  completed_at?: string | null;
  created_at?: string;
}

export interface LawCase {
  id: string;
  codigo_interno: string;
  caratula: string;
  nro_expediente: string;
  juzgado: string;
  fuero: string;
  estado: CaseStatus;
  abogado_responsable: string;
  cliente_nombre: string;
  cliente_dni: string;
  contraparte: string;
  fecha_inicio: string;
  updatedAt?: string;
  updated_at?: string;
  createdBy?: string;
  created_by?: string;
  created_by_username?: string;
  lastModifiedBy?: string;
  last_modified_by?: string;
  last_modified_by_username?: string;
  created_at?: string;
  actuaciones?: CaseActuacion[];
  alertas?: CaseAlerta[];
  notas?: CaseNote[];
}

export type ViewState = 'dashboard' | 'cases' | 'new-case' | 'case-detail' | 'users';
