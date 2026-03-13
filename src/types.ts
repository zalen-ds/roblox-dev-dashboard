export type UserRole = 'ADMIN_MASTER' | 'USER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type TaskArea = 'Script' | 'UI' | 'Map';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: string;
  username: string;
  password?: string;
  status: UserStatus;
  role: UserRole;
  can_edit_db: boolean;
  needs_password_change: boolean;
}

export interface Task {
  id: string;
  title: string;
  area: TaskArea;
  status: TaskStatus;
  lua_code: string;
}

export interface DataStoreItem {
  id: string;
  key: string;
  value: any;
}
