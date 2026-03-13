import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task, User, DataStoreEntry } from '../types';
import { 
  Users, 
  CheckSquare, 
  Database, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    tasks: 0,
    datastore: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: usersCount },
        { count: tasksCount },
        { count: dsCount },
        { count: pendingCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('datastore_entries').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'TODO')
      ]);

      setStats({
        users: usersCount || 0,
        tasks: tasksCount || 0,
        datastore: dsCount || 0,
        pendingTasks: pendingCount || 0
      });
    }

    fetchStats();
  }, []);

  const cards = [
    { label: 'Usuários Totais', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Tarefas Ativas', value: stats.tasks, icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Itens DataStore', value: stats.datastore, icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Tarefas Pendentes', value: stats.pendingTasks, icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 mt-2">Bem-vindo ao centro de operações Dev Ops.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                Live <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{card.label}</h3>
            <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-slate-800/50">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Sistema operacional estável</p>
                  <p className="text-xs text-slate-500">Monitoramento em tempo real ativo</p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">AGORA</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Status do Servidor</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Uso de CPU</span>
                <span className="text-emerald-500">12%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[12%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Memória</span>
                <span className="text-emerald-500">45%</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[45%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Latência API</span>
                <span className="text-emerald-500">24ms</span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[10%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
