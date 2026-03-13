/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  Database, 
  FileText, 
  LogOut, 
  Shield, 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle,
  UserCheck,
  UserX,
  Settings,
  Code
} from 'lucide-react';
import { supabase } from './supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type UserStatus = 'PENDING' | 'APPROVED' | 'DENIED';
type UserRole = 'USER' | 'ADMIN_MASTER';
type TaskArea = 'Script' | 'UI' | 'Map';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface UserProfile {
  id: string;
  username: string;
  status: UserStatus;
  role: UserRole;
  can_edit_db: boolean;
}

interface Task {
  id: string;
  title: string;
  area: TaskArea;
  status: TaskStatus;
  lua_code: string;
  created_at: string;
}

interface DataStoreItem {
  id: string;
  key: string;
  value: any;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
      active 
        ? "bg-roblox-blue/10 text-roblox-blue border-r-2 border-roblox-blue" 
        : "text-roblox-text-muted hover:bg-roblox-card hover:text-roblox-text"
    )}
  >
    <Icon size={18} />
    {label}
  </button>
);

const Card = ({ children, className, title }: { children: React.ReactNode, className?: string, title?: string, key?: React.Key }) => (
  <div className={cn("bg-roblox-card border border-roblox-border rounded-md overflow-hidden", className)}>
    {title && (
      <div className="px-4 py-2 border-bottom border-roblox-border bg-black/20 text-xs font-bold uppercase tracking-wider text-roblox-text-muted">
        {title}
      </div>
    )}
    <div className="p-4">
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant }: { children: React.ReactNode, variant: TaskArea | TaskStatus | 'ADMIN' | 'PENDING' | 'APPROVED' }) => {
  const variants: Record<string, string> = {
    Script: "bg-roblox-green/20 text-roblox-green border-roblox-green/30",
    UI: "bg-roblox-blue/20 text-roblox-blue border-roblox-blue/30",
    Map: "bg-roblox-orange/20 text-roblox-orange border-roblox-orange/30",
    TODO: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    IN_PROGRESS: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    DONE: "bg-roblox-green/20 text-roblox-green border-roblox-green/30",
    ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    APPROVED: "bg-roblox-green/20 text-roblox-green border-roblox-green/30",
  };
  
  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase border rounded", variants[variant] || "bg-gray-500/20 text-gray-400")}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'tasks' | 'datastore' | 'logs'>('tasks');
  
  // Auth State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dataStore, setDataStore] = useState<DataStoreItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Task Form
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', area: 'Script' as TaskArea, lua_code: '-- Lua code here' });

  // DataStore Form
  const [editingDataId, setEditingDataId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (isLoggedIn && user?.status === 'APPROVED') {
      fetchTasks();
      fetchDataStore();
      if (user.role === 'ADMIN_MASTER') {
        fetchUsers();
      }
    }
  }, [isLoggedIn, user]);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) setUsers(data);
  };

  const fetchDataStore = async () => {
    const { data } = await supabase.from('datastore').select('*');
    if (data) setDataStore(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // Admin Fixo Check
    if (usernameInput === 'admin' && passwordInput === 'zalen123') {
      const adminUser: UserProfile = {
        id: 'admin-id',
        username: 'admin',
        status: 'APPROVED',
        role: 'ADMIN_MASTER',
        can_edit_db: true
      };
      setUser(adminUser);
      setIsLoggedIn(true);
      return;
    }

    // Supabase Auth Check (Simulated for this demo as per requirements)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', usernameInput)
      .eq('password', passwordInput)
      .single();

    if (error || !data) {
      setAuthError('Usuário ou senha incorretos.');
    } else {
      setUser(data);
      setIsLoggedIn(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const { error } = await supabase.from('users').insert([{
      username: usernameInput,
      password: passwordInput,
      status: 'PENDING',
      role: 'USER',
      can_edit_db: false
    }]);

    if (error) {
      setAuthError('Erro ao cadastrar. Username pode já existir.');
    } else {
      setIsRegistering(false);
      setAuthError('Cadastro realizado! Aguarde aprovação.');
    }
  };

  const handleCreateTask = async () => {
    const { error } = await supabase.from('tasks').insert([{
      ...newTask,
      status: 'TODO'
    }]);
    if (!error) {
      setShowTaskModal(false);
      fetchTasks();
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    fetchTasks();
  };

  const handleApproveUser = async (id: string) => {
    await supabase.from('users').update({ status: 'APPROVED' }).eq('id', id);
    fetchUsers();
  };

  const handleDenyUser = async (id: string) => {
    await supabase.from('users').update({ status: 'DENIED' }).eq('id', id);
    fetchUsers();
  };

  const togglePermission = async (id: string, current: boolean) => {
    await supabase.from('users').update({ can_edit_db: !current }).eq('id', id);
    fetchUsers();
  };

  const handleSaveDataStore = async (id: string) => {
    try {
      const parsed = JSON.parse(editValue);
      await supabase.from('datastore').update({ value: parsed }).eq('id', id);
      setEditingDataId(null);
      fetchDataStore();
    } catch (e) {
      alert('JSON Inválido');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-roblox-bg p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-roblox-blue rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-roblox-blue/20">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Roblox Dev Center</h1>
            <p className="text-roblox-text-muted text-sm">Dashboard de Controle</p>
          </div>

          <Card title={isRegistering ? "Novo Cadastro" : "Login de Desenvolvedor"}>
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-roblox-text-muted uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-roblox-bg border border-roblox-border rounded px-3 py-2 text-sm focus:outline-none focus:border-roblox-blue transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-roblox-text-muted uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-roblox-bg border border-roblox-border rounded px-3 py-2 text-sm focus:outline-none focus:border-roblox-blue transition-colors"
                  required
                />
              </div>
              
              {authError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                  <AlertCircle size={14} />
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-roblox-blue hover:bg-roblox-blue/90 text-white font-bold py-2 rounded text-sm transition-all shadow-md shadow-roblox-blue/20"
              >
                {isRegistering ? "CADASTRAR" : "ENTRAR"}
              </button>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-roblox-text-muted hover:text-roblox-text text-xs font-medium py-1"
              >
                {isRegistering ? "Já tenho conta? Login" : "Não tem conta? Cadastrar"}
              </button>
            </form>
          </Card>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-roblox-text-muted uppercase tracking-widest">Admin Demo: admin / zalen123</p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.status !== 'APPROVED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-roblox-bg text-center p-6">
        <div className="w-20 h-20 bg-roblox-card border border-roblox-border rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Shield className="text-roblox-text-muted" size={40} />
        </div>
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-roblox-text-muted max-w-sm">
          Aguarde até que sua conta seja confirmada pelo administrador.
        </p>
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="mt-8 text-roblox-blue hover:underline text-sm font-medium flex items-center gap-2"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-roblox-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-roblox-card border-r border-roblox-border flex flex-col">
        <div className="p-6 border-b border-roblox-border flex items-center gap-3">
          <div className="w-8 h-8 bg-roblox-blue rounded flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">Roblox Dev</h2>
            <span className="text-[10px] text-roblox-text-muted uppercase font-bold">Studio Dashboard</span>
          </div>
        </div>

        <nav className="flex-1 py-4">
          <SidebarItem 
            icon={CheckSquare} 
            label="Tasks" 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
          />
          <SidebarItem 
            icon={Database} 
            label="DataStore" 
            active={activeTab === 'datastore'} 
            onClick={() => setActiveTab('datastore')} 
          />
          {user.role === 'ADMIN_MASTER' && (
            <SidebarItem 
              icon={Users} 
              label="Users" 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')} 
            />
          )}
          <SidebarItem 
            icon={FileText} 
            label="Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
        </nav>

        <div className="p-4 border-t border-roblox-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-roblox-bg border border-roblox-border flex items-center justify-center overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-roblox-text-muted uppercase font-bold">{user.role}</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="text-roblox-text-muted hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
            <p className="text-roblox-text-muted text-sm">Gerenciamento de recursos do projeto</p>
          </div>
          
          {activeTab === 'tasks' && (
            <button 
              onClick={() => setShowTaskModal(true)}
              className="bg-roblox-blue hover:bg-roblox-blue/90 text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-2 transition-all"
            >
              <Plus size={18} /> Nova Task
            </button>
          )}
        </header>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map(status => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-bold text-roblox-text-muted uppercase tracking-widest">
                    {status === 'TODO' ? 'A Fazer' : status === 'IN_PROGRESS' ? 'Em Curso' : 'Concluído'}
                  </h3>
                  <span className="bg-roblox-card px-2 py-0.5 rounded text-[10px] text-roblox-text-muted border border-roblox-border">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.filter(t => t.status === status).map(task => (
                    <Card key={task.id} className="hover:border-roblox-blue/50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={task.area}>{task.area}</Badge>
                        {status === 'TODO' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="text-roblox-text-muted hover:text-roblox-blue"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {status === 'IN_PROGRESS' && (
                          <button 
                            onClick={() => updateTaskStatus(task.id, 'DONE')}
                            className="text-roblox-text-muted hover:text-roblox-green"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                      </div>
                      <h4 className="text-sm font-bold mb-2">{task.title}</h4>
                      
                      {task.lua_code && (
                        <div className="mt-3 bg-black/40 rounded p-2 border border-white/5">
                          <div className="flex items-center gap-2 mb-1 opacity-50">
                            <Code size={10} />
                            <span className="text-[8px] uppercase font-bold">Lua Source</span>
                          </div>
                          <pre className="text-[10px] font-mono text-roblox-green/80 overflow-x-auto">
                            {task.lua_code}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DataStore Tab */}
        {activeTab === 'datastore' && (
          <Card title="Global DataStore Viewer">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-roblox-border text-roblox-text-muted text-[10px] uppercase font-bold">
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value (JSON)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-roblox-border">
                  {dataStore.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-mono text-roblox-blue">{item.key}</td>
                      <td className="px-4 py-4">
                        {editingDataId === item.id ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-roblox-bg border border-roblox-border rounded p-2 font-mono text-xs text-roblox-green"
                            rows={4}
                          />
                        ) : (
                          <pre className="text-xs font-mono text-roblox-text-muted bg-black/20 p-2 rounded truncate max-w-md">
                            {JSON.stringify(item.value, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {user.can_edit_db && (
                          editingDataId === item.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleSaveDataStore(item.id)}
                                className="p-2 text-roblox-green hover:bg-roblox-green/10 rounded"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={() => setEditingDataId(null)}
                                className="p-2 text-roblox-text-muted hover:bg-white/10 rounded"
                              >
                                <UserX size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingDataId(item.id);
                                setEditValue(JSON.stringify(item.value, null, 2));
                              }}
                              className="p-2 text-roblox-blue hover:bg-roblox-blue/10 rounded"
                            >
                              <Settings size={16} />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Users Tab (Admin Only) */}
        {activeTab === 'users' && user.role === 'ADMIN_MASTER' && (
          <div className="space-y-6">
            <Card title="Usuários Pendentes">
              <div className="space-y-4">
                {users.filter(u => u.status === 'PENDING').length === 0 && (
                  <p className="text-center py-8 text-roblox-text-muted text-sm italic">Nenhum usuário aguardando aprovação.</p>
                )}
                {users.filter(u => u.status === 'PENDING').map(pendingUser => (
                  <div key={pendingUser.id} className="flex items-center justify-between p-3 bg-roblox-bg border border-roblox-border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-roblox-card flex items-center justify-center">
                        <Users size={16} className="text-roblox-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{pendingUser.username}</p>
                        <Badge variant="PENDING">Aguardando</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveUser(pendingUser.id)}
                        className="p-2 bg-roblox-green/20 text-roblox-green hover:bg-roblox-green/30 rounded border border-roblox-green/30 transition-colors"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button 
                        onClick={() => handleDenyUser(pendingUser.id)}
                        className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Gerenciamento de Permissões">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-roblox-border text-roblox-text-muted text-[10px] uppercase font-bold">
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Edit DataStore</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-roblox-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-bold">{u.username}</td>
                        <td className="px-4 py-4">
                          <Badge variant={u.status}>{u.status}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          {u.role === 'ADMIN_MASTER' ? <Badge variant="ADMIN">Admin</Badge> : 'Developer'}
                        </td>
                        <td className="px-4 py-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={u.can_edit_db} 
                              onChange={() => togglePermission(u.id, u.can_edit_db)}
                              className="sr-only peer" 
                              disabled={u.role === 'ADMIN_MASTER'}
                            />
                            <div className="w-9 h-5 bg-roblox-bg border border-roblox-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-roblox-text-muted after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-roblox-blue peer-checked:after:bg-white"></div>
                          </label>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {u.role !== 'ADMIN_MASTER' && (
                            <button className="text-roblox-text-muted hover:text-red-400">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <Card title="System Output">
            <div className="bg-black/40 rounded p-4 font-mono text-xs space-y-2 border border-white/5 min-h-[400px]">
              <p className="text-roblox-text-muted">[05:01:51] Initializing Roblox Dev Dashboard v1.0.4...</p>
              <p className="text-roblox-green">[05:01:52] Supabase connection established successfully.</p>
              <p className="text-roblox-blue">[05:01:52] Loading DataStore service... OK</p>
              <p className="text-roblox-blue">[05:01:53] Loading Task module... OK</p>
              <p className="text-roblox-text-muted">[05:01:55] User {user.username} authenticated as {user.role}.</p>
              <div className="animate-pulse inline-block w-2 h-4 bg-roblox-text-muted ml-1"></div>
            </div>
          </Card>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <Card title="Criar Nova Tarefa">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-roblox-text-muted uppercase mb-1">Título</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-roblox-bg border border-roblox-border rounded px-3 py-2 text-sm focus:outline-none focus:border-roblox-blue"
                      placeholder="Ex: Sistema de Inventário"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-roblox-text-muted uppercase mb-1">Área</label>
                    <select
                      value={newTask.area}
                      onChange={(e) => setNewTask({...newTask, area: e.target.value as TaskArea})}
                      className="w-full bg-roblox-bg border border-roblox-border rounded px-3 py-2 text-sm focus:outline-none focus:border-roblox-blue"
                    >
                      <option value="Script">Scripting</option>
                      <option value="UI">Interface (UI)</option>
                      <option value="Map">Map Design</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-roblox-text-muted uppercase mb-1">Lua Source (Opcional)</label>
                  <textarea
                    value={newTask.lua_code}
                    onChange={(e) => setNewTask({...newTask, lua_code: e.target.value})}
                    className="w-full bg-roblox-bg border border-roblox-border rounded px-3 py-2 text-sm font-mono text-roblox-green focus:outline-none focus:border-roblox-blue"
                    rows={8}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-sm font-bold text-roblox-text-muted hover:text-roblox-text"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleCreateTask}
                    className="bg-roblox-blue hover:bg-roblox-blue/90 text-white text-sm font-bold px-6 py-2 rounded shadow-lg shadow-roblox-blue/20"
                  >
                    CRIAR TASK
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

