import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskArea, TaskStatus } from '../types';
import { 
  Plus, 
  Code2, 
  Layout, 
  Map as MapIcon, 
  Clock, 
  CheckCircle2, 
  Circle,
  Save,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false });
    
    if (!error && data) {
      setTasks(data);
    }
    setIsLoading(false);
  }

  async function handleSaveTask() {
    if (!editingTask) return;

    const { error } = await supabase
      .from('tasks')
      .upsert(editingTask);
    
    if (!error) {
      setEditingTask(null);
      fetchTasks();
    }
  }

  const areaIcons = {
    Script: Code2,
    UI: Layout,
    Map: MapIcon
  };

  const statusIcons = {
    TODO: Circle,
    IN_PROGRESS: Clock,
    DONE: CheckCircle2
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tarefas de Desenvolvimento</h1>
          <p className="text-slate-400 mt-2">Acompanhe o progresso do projeto Roblox.</p>
        </div>
        <button 
          onClick={() => setEditingTask({ id: '', title: '', area: 'Script', status: 'TODO', lua_code: '' })}
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
          const AreaIcon = areaIcons[task.area];
          const StatusIcon = statusIcons[task.status];
          
          return (
            <div 
              key={task.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors cursor-pointer group"
              onClick={() => setEditingTask(task)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-emerald-500 transition-colors">
                    <AreaIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{task.area}</span>
                </div>
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
              <div className="h-20 bg-black/40 rounded-lg p-3 border border-slate-800 overflow-hidden">
                <code className="text-xs text-slate-500 font-mono block truncate">
                  {task.lua_code || '-- Sem código Lua'}
                </code>
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingTask.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setEditingTask(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Área</label>
                    <select
                      value={editingTask.area}
                      onChange={(e) => setEditingTask({ ...editingTask, area: e.target.value as TaskArea })}
                      className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Script">Script</option>
                      <option value="UI">UI</option>
                      <option value="Map">Map</option>
                    </select>
                  </div>
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
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Código Lua</label>
                <textarea
                  value={editingTask.lua_code}
                  onChange={(e) => setEditingTask({ ...editingTask, lua_code: e.target.value })}
                  className="w-full h-64 bg-black border border-slate-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 resize-none lua-editor"
                  placeholder="-- Insira seu código Lua aqui..."
                  spellCheck={false}
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
