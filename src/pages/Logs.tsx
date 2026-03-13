import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SystemLog } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  Shield, 
  MessageSquare, 
  Users, 
  User as UserIcon, 
  Terminal,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryIcons = {
  AUTH: Shield,
  CHAT: MessageSquare,
  GROUP: Users,
  USER: UserIcon,
  TEAM: Terminal,
  SYSTEM: AlertCircle
};

const categoryColors = {
  AUTH: 'text-blue-500 bg-blue-500/10',
  CHAT: 'text-emerald-500 bg-emerald-500/10',
  GROUP: 'text-purple-500 bg-purple-500/10',
  USER: 'text-orange-500 bg-orange-500/10',
  TEAM: 'text-pink-500 bg-pink-500/10',
  SYSTEM: 'text-red-500 bg-red-500/10'
};

export default function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) setLogs(data);
    setIsLoading(false);
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-slate-800 rounded-2xl">
            <History className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Logs do Sistema</h1>
            <p className="text-slate-400">Acompanhe todas as ações realizadas na plataforma.</p>
          </div>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-black/20 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ação, usuário ou detalhes..."
              className="w-full bg-black border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="AUTH">Autenticação</option>
              <option value="CHAT">Chat</option>
              <option value="GROUP">Grupos</option>
              <option value="USER">Usuários</option>
              <option value="TEAM">Equipe</option>
              <option value="SYSTEM">Sistema</option>
            </select>
          </div>
          <button 
            onClick={fetchLogs}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition-colors"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Data/Hora</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Usuário</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Ação</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Carregando logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : filteredLogs.map((log) => {
                const Icon = categoryIcons[log.category as keyof typeof categoryIcons] || AlertCircle;
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        categoryColors[log.category as keyof typeof categoryColors]
                      )}>
                        <Icon className="w-3 h-3" />
                        {log.category}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {log.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{log.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-white">
                      {log.action}
                    </td>
                    <td className="p-4 text-sm text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
