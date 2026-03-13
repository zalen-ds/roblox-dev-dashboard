import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskPriority, User } from '../types';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Circle,
  Save,
  X,
  User as UserIcon,
  AlertTriangle,
  AlignLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
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

  async function handleSaveTask() {
    if (!editingTask) return;

    const { id, ...taskData } = editingTask;
    const { error } = id 
      ? await supabase.from('tasks').update(taskData).eq('id', id)
      : await supabase.from('tasks').insert([taskData]);
    
    if (!error) {
      setEditingTask(null);
      fetchTasks();
    }
  }

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
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tarefas de Desenvolvimento</h1>
          <p className="text-slate-400 mt-2">Acompanhe e atribua tarefas para a equipe.</p>
        </div>
        <button 
          onClick={() => setEditingTask({ id: '', title: '', description: '', status: 'TODO', priority: 'MEDIUM', assigned_to: null })}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Carregando tarefas...</div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Nenhuma tarefa encontrada.</div>
        ) : tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          
          return (
            <div 
              key={task.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors cursor-pointer group flex flex-col h-full"
              onClick={() => setEditingTask(task)}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase",
                  priorityColors[task.priority]
                )}>
                  {task.priority}
                </span>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase",
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
