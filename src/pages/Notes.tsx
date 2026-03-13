import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Note, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  StickyNote, 
  Save, 
  Users, 
  Search,
  ChevronRight,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Notes() {
  const [note, setNote] = useState<Note | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN_MASTER';

  useEffect(() => {
    if (user) {
      setSelectedUserId(user.id);
      setSelectedUsername(user.username);
    }
    if (isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      fetchNote(selectedUserId);
    }
  }, [selectedUserId]);

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('username', { ascending: true });
    if (data) setUsers(data);
  }

  async function fetchNote(userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Note doesn't exist, create a blank one
      setNote({
        id: '',
        user_id: userId,
        username: selectedUsername || '',
        content: '',
        updated_at: new Date().toISOString()
      });
    } else if (data) {
      setNote(data);
    }
  }

  async function handleSave() {
    if (!note || !selectedUserId) return;
    setIsSaving(true);

    const noteData = {
      user_id: selectedUserId,
      username: selectedUsername || '',
      content: note.content,
      updated_at: new Date().toISOString()
    };

    const { error } = note.id 
      ? await supabase.from('notes').update(noteData).eq('id', note.id)
      : await supabase.from('notes').insert([noteData]);
    
    if (!error) {
      fetchNote(selectedUserId);
    }
    setIsSaving(false);
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-black">
      {isAdmin && (
        <aside className="w-72 border-r border-slate-800 bg-slate-900/30 flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Notas da Equipe
            </h2>
            <div className="relative mt-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar dev..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                  setSelectedUsername(u.username);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                  selectedUserId === u.id 
                    ? "bg-emerald-500 text-black" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    selectedUserId === u.id ? "bg-black/20" : "bg-slate-800"
                  )}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{u.username}</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  selectedUserId === u.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col">
        <header className="p-8 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-emerald-500" />
              {isAdmin && selectedUserId !== user?.id ? `Notas de ${selectedUsername}` : 'Meu Bloco de Notas'}
            </h1>
            <p className="text-slate-400 mt-2">
              {isAdmin && selectedUserId !== user?.id 
                ? 'Visualizando e editando notas privadas deste desenvolvedor.' 
                : 'Suas anotações privadas e rascunhos de projeto.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {note?.updated_at && (
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                <Clock className="w-3 h-3" />
                SALVO EM: {new Date(note.updated_at).toLocaleString()}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !note}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Salvando...' : 'Salvar Notas'}
            </button>
          </div>
        </header>

        <div className="flex-1 p-8">
          <textarea
            value={note?.content || ''}
            onChange={(e) => setNote(prev => prev ? { ...prev, content: e.target.value } : null)}
            className="w-full h-full bg-slate-900/30 border border-slate-800 rounded-2xl p-8 text-white text-lg focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner leading-relaxed"
            placeholder="Comece a escrever suas notas aqui..."
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  );
}
