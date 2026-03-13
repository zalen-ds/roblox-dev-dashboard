import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Group, User } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  UserPlus,
  UserMinus,
  Search,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { logAction } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';

export default function GroupManagement() {
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<Partial<Group> | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const [groupsRes, usersRes] = await Promise.all([
      supabase.from('groups').select('*').order('name'),
      supabase.from('users').select('*').order('full_name')
    ]);

    if (groupsRes.data) setGroups(groupsRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    setIsLoading(false);
  }

  async function fetchGroupMembers(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    
    if (data) {
      setGroupMembers(data.map(m => m.user_id));
    }
  }

  async function handleSaveGroup() {
    if (!editingGroup?.name) return;

    const { id, ...data } = editingGroup;
    const { error } = id 
      ? await supabase.from('groups').update(data).eq('id', id)
      : await supabase.from('groups').insert([data]);

    if (!error && currentUser) {
      await logAction(
        id ? 'Grupo Atualizado' : 'Grupo Criado',
        'GROUP',
        `Grupo "${data.name}" ${id ? 'atualizado' : 'criado'} por ${currentUser.username}.`,
        currentUser.id,
        currentUser.username
      );
      setEditingGroup(null);
      fetchData();
    } else if (error) {
      console.error('Error saving group:', error);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('Tem certeza que deseja remover este grupo?')) return;
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (!error && currentUser) {
      await logAction(
        'Grupo Removido',
        'GROUP',
        `Grupo ID ${id} removido por ${currentUser.username}.`,
        currentUser.id,
        currentUser.username
      );
      if (selectedGroup?.id === id) setSelectedGroup(null);
      fetchData();
    }
  }

  async function toggleMember(userId: string) {
    if (!selectedGroup) return;

    const isMember = groupMembers.includes(userId);

    if (isMember) {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('user_id', userId);
      
      if (!error && currentUser) {
        await logAction(
          'Membro Removido',
          'GROUP',
          `Usuário ID ${userId} removido do grupo "${selectedGroup.name}" por ${currentUser.username}.`,
          currentUser.id,
          currentUser.username
        );
        setGroupMembers(prev => prev.filter(id => id !== userId));
      }
    } else {
      const { error } = await supabase
        .from('group_members')
        .insert([{ group_id: selectedGroup.id, user_id: userId }]);
      
      if (!error && currentUser) {
        await logAction(
          'Membro Adicionado',
          'GROUP',
          `Usuário ID ${userId} adicionado ao grupo "${selectedGroup.name}" por ${currentUser.username}.`,
          currentUser.id,
          currentUser.username
        );
        setGroupMembers(prev => [...prev, userId]);
      }
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Gerenciamento de Grupos</h1>
        <p className="text-slate-400 mt-2">Crie grupos e gerencie seus membros.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Groups List */}
        <section className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Grupos</h2>
            </div>
            <button 
              onClick={() => setEditingGroup({ name: '', description: '' })}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-slate-500 py-4">Carregando...</p>
            ) : groups.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhum grupo cadastrado.</p>
            ) : groups.map((group) => (
              <div 
                key={group.id} 
                onClick={() => {
                  setSelectedGroup(group);
                  fetchGroupMembers(group.id);
                }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                  selectedGroup?.id === group.id 
                    ? "bg-emerald-500/10 border-emerald-500/50" 
                    : "bg-black/40 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{group.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{group.description || 'Sem descrição.'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Members Management */}
        <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-black/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-white">
                  {selectedGroup ? `Membros: ${selectedGroup.name}` : 'Selecione um grupo'}
                </h2>
              </div>
              {selectedGroup && (
                <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                  {groupMembers.length} membros
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuários para adicionar..."
                className="w-full bg-black border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-6">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>Selecione um grupo à esquerda para gerenciar seus membros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map((user) => {
                  const isMember = groupMembers.includes(user.id);
                  return (
                    <div 
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        isMember 
                          ? "bg-blue-500/5 border-blue-500/30" 
                          : "bg-black/20 border-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMember(user.id)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          isMember 
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" 
                            : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        )}
                      >
                        {isMember ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingGroup.id ? 'Editar Grupo' : 'Novo Grupo'}</h2>
              <button onClick={() => setEditingGroup(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Grupo</label>
                <input 
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full bg-black border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Equipe de Design"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição</label>
                <textarea 
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  className="w-full h-24 bg-black border border-slate-700 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Descreva o propósito do grupo..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
              <button onClick={() => setEditingGroup(null)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSaveGroup} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
