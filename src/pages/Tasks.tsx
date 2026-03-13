import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskPriority, User, Role, Area } from '../types';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle,
  Save,
  X,
  User as UserIcon,
  AlertTriangle,
  AlignLeft,
  Filter,
  Layers,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchMetadata();
  }, []);

  async function fetchTasks() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTasks(data);
    }
    setIsLoading(false);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('status', 'APPROVED');
    if (data) setUsers(data as User[]);
  }

  async function fetchMetadata() {
    const [rolesRes, areasRes] = await Promise.all([
      supabase.from('roles').select('*'),
      supabase.from('areas').select('*')
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (areasRes.data) setAreas(areasRes.data);
  }

  async function handleSaveTask() {
    if (!editingTask?.title) return;

    const { id, ...taskData } = editingTask;
    
    // Ensure all fields are present or null
    const payload = {
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      assigned_to: taskData.assigned_to || null,
      role_id: taskData.role_id || null,
      area_id: taskData.area_id || null
    };

    const { error } = id 
      ? await supabase.from('tasks').update(payload).eq('id', id)
      : await supabase.from('tasks').insert([payload]);
    
    if (!error) {
      setEditingTask(null);
      fetchTasks();
    } else {
      console.error('Error saving task:', error);
      alert('Erro ao salvar tarefa. Verifique os campos e tente novamente.');
    }
  }

  const filteredTasks = tasks.filter(task => {
    const areaMatch = filterArea === 'all' || task.area_id === filterArea;
    const roleMatch = filterRole === 'all' || task.role_id === filterRole;
    return areaMatch && roleMatch;
  });

  const statusIcons = {
    TODO: Circle,
    IN_PROGRESS: Clock,
    DONE: CheckCircle2
  };

  const priorityColors = {
    LOW: 'text-blue-400 bg-blue-400/10',
    MEDIUM: 'text-yellow-400 bg-yellow-400/10',
    HIGH: 'text-red-400 bg-red-400/10'
  };

  return (
    <div className="p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tarefas de Desenvolvimento</h1>
          <p className="text-slate-400 mt-2">Acompanhe e atribua tarefas para a equipe.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">Todas Áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent text-sm text-slate-300 focus:outline-none"
            >
              <option value="all">Todos Cargos</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setEditingTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigned_to: null, role_id: null, area_id: null })}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Carregando tarefas...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Nenhuma tarefa encontrada para os filtros selecionados.</div>
        ) : filteredTasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          const taskArea = areas.find(a => a.id === task.area_id);
          const taskRole = roles.find(r => r.id === task.role_id);
          
          return (
            <div 
              key={task.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors cursor-pointer group flex flex-col h-full"
              onClick={() => setEditingTask(task)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    priorityColors[task.priority]
                  )}>
                    {task.priority}
                  </span>
                  {taskArea && (
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400">
                      {taskArea.name}
                    </span>
                  )}
                  {taskRole && (
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400">
                      {taskRole.name}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0",
                  task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500' :
                  task.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {task.status}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{task.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                {task.description || 'Sem descrição.'}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-300">
                    {task.assigned_to || 'Não atribuída'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingTask.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setEditingTask(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Título</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Título da tarefa"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Prioridade</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                    className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">BAIXA</option>
                    <option value="MEDIUM">MÉDIA</option>
                    <option value="HIGH">ALTA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Área</label>
                  <select
                    value={editingTask.area_id || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, area_id: e.target.value || null })}
                    className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Nenhuma</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Cargo Alvo</label>
                  <select
                    value={editingTask.role_id || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, role_id: e.target.value || null })}
                    className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Nenhum</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Atribuído a</label>
                  <select
                    value={editingTask.assigned_to || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value || null })}
                    className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ninguém</option>
                    {users.map(u => (
                      <option key={u.username} value={u.username}>{u.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full h-32 bg-black border border-slate-700 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Descreva a tarefa..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
              <button 
                onClick={() => setEditingTask(null)}
                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTask}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
