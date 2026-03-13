export type UserStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface Area {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  status: UserStatus;
  role: string; // Name of the role
  role_id?: string;
  areas?: Area[]; // Multiple areas
  can_edit_db: boolean;
  needs_password_change: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  role_id: string | null;
  area_id: string | null;
  created_at?: string;
}

export interface Message {
  id: string;
  sender_username: string;
  content: string;
  channel: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  username: string;
  content: string;
  updated_at: string;
}

export interface DataStoreEntry {
  id: string;
  player_id: number;
  player_name: string;
  data: any;
  updated_at: string;
}
