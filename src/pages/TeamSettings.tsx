import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Role, Area } from '../types';
import { 
  Shield, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Info
} from 'lucide-react';

import { cn } from '../lib/utils';
import { logAction } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';

export default function TeamSettings() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [editingArea, setEditingArea] = useState<Partial<Area> | null>(null);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('team-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, () => fetchData())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const [rolesRes, areasRes] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('areas').select('*').order('name')
    ]);

    if (rolesRes.data) setRoles(rolesRes.data);
    if (areasRes.data) setAreas(areasRes.data);
    setIsLoading(false);
  }

  async function handleSaveRole() {
    if (!editingRole?.name) return;

    const { id, ...data } = editingRole;
    const { error } = id 
      ? await supabase.from('roles').update(data).eq('id', id)
      : await supabase.from('roles').insert([data]);

    if (!error) {
      if (user) {
        await logAction(
          id ? 'Cargo Atualizado' : 'Cargo Criado',
          'TEAM',
          `Cargo "${data.name}" ${id ? 'atualizado' : 'criado'} por ${user.username}.`,
          user.id,
          user.username
        );
      }
      setEditingRole(null);
      fetchData();
    } else {
      console.error('Error saving role:', error);
      alert(`Erro ao salvar cargo: ${error.message}`);
    }
  }

  async function handleSaveArea() {
    if (!editingArea?.name) return;

    const { id, ...data } = editingArea;
    const { error } = id 
      ? await supabase.from('areas').update(data).eq('id', id)
      : await supabase.from('areas').insert([data]);

    if (!error) {
      if (user) {
        await logAction(
          id ? 'Área Atualizada' : 'Área Criada',
          'TEAM',
          `Área "${data.name}" ${id ? 'atualizada' : 'criada'} por ${user.username}.`,
          user.id,
          user.username
        );
      }
      setEditingArea(null);
      fetchData();
    } else {
      console.error('Error saving area:', error);
      alert(`Erro ao salvar área: ${error.message}`);
    }
  }

  async function handleDeleteRole(id: string) {
    if (!confirm('Tem certeza que deseja remover este cargo? Isso pode afetar usuários vinculados.')) return;
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (!error) {
      if (user) {
        await logAction(
          'Cargo Removido',
          'TEAM',
          `Cargo ID ${id} removido por ${user.username}.`,
          user.id,
          user.username
        );
      }
      fetchData();
    }
  }

  async function handleDeleteArea(id: string) {
    if (!confirm('Tem certeza que deseja remover esta área? Isso pode afetar tarefas vinculadas.')) return;
    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (!error) {
      if (user) {
        await logAction(
          'Área Removida',
          'TEAM',
          `Área ID ${id} removida por ${user.username}.`,
          user.id,
          user.username
        );
      }
      fetchData();
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Configurações de Equipe</h1>
        <p className="text-slate-400 mt-2">Gerencie cargos e áreas de atuação da equipe.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Management */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Cargos</h2>
            </div>
            <button 
              onClick={() => setEditingRole({ name: '', description: '' })}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isLoading ? (
              <p className="text-center text-slate-500 py-4">Carregando...</p>
            ) : roles.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhum cargo cadastrado.</p>
            ) : roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-slate-800 hover:border-emerald-500/30 transition-colors group">
                <div>
                  <h3 className="font-bold text-white">{role.name}</h3>
                  <p className="text-sm text-slate-400">{role.description || 'Sem descrição.'}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingRole(role)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Areas Management */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Áreas</h2>
            </div>
            <button 
              onClick={() => setEditingArea({ name: '', description: '' })}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isLoading ? (
              <p className="text-center text-slate-500 py-4">Carregando...</p>
            ) : areas.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhuma área cadastrada.</p>
            ) : areas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-slate-800 hover:border-blue-500/30 transition-colors group">
                <div>
                  <h3 className="font-bold text-white">{area.name}</h3>
                  <p className="text-sm text-slate-400">{area.description || 'Sem descrição.'}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingArea(area)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteArea(area.id)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingRole.id ? 'Editar Cargo' : 'Novo Cargo'}</h2>
              <button onClick={() => setEditingRole(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Cargo</label>
                <input 
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Senior Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea 
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full h-24 bg-black border border-slate-700 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Descreva as responsabilidades..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
              <button onClick={() => setEditingRole(null)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSaveRole} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Modal */}
      {editingArea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingArea.id ? 'Editar Área' : 'Nova Área'}</h2>
              <button onClick={() => setEditingArea(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Área</label>
                <input 
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                  className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Backend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea 
                  value={editingArea.description}
                  onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                  className="w-full h-24 bg-black border border-slate-700 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Descreva o foco desta área..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
              <button onClick={() => setEditingArea(null)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSaveArea} className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
