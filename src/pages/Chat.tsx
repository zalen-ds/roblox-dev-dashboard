import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message, User, Area, Group } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  Globe, 
  Users, 
  Terminal, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  X, 
  Check,
  MessageSquare,
  Search,
  Trash,
  Hash
} from 'lucide-react';
import { cn } from '../lib/utils';

type ChatType = 'global' | 'area' | 'private' | 'admin_all' | 'group';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatType, setChatType] = useState<ChatType>('global');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN_MASTER';

  useEffect(() => {
    fetchMetadata();
    fetchUsers();
  }, [user]);

  async function fetchMetadata() {
    if (!user) return;

    const [areasRes, groupsRes] = await Promise.all([
      supabase.from('areas').select('*'),
      isAdmin 
        ? supabase.from('groups').select('*')
        : supabase.from('groups').select('*, group_members!inner(*)').eq('group_members.user_id', user.id)
    ]);

    if (areasRes.data) setAllAreas(areasRes.data);
    if (groupsRes.data) setUserGroups(groupsRes.data);
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*').eq('status', 'APPROVED');
    if (data) setAllUsers(data);
  }

  const currentArea = allAreas.find(a => a.id === selectedAreaId);
  const currentGroup = userGroups.find(g => g.id === selectedGroupId);
  const currentTargetUser = allUsers.find(u => u.id === selectedUserId);

  const getChannelName = () => {
    if (chatType === 'global') return 'global';
    if (chatType === 'area') return `area:${selectedAreaId}`;
    if (chatType === 'group') return `group:${selectedGroupId}`;
    if (chatType === 'private' && selectedUserId && user) {
      const ids = [user.id, selectedUserId].sort();
      return `private:${ids[0]}:${ids[1]}`;
    }
    if (chatType === 'admin_all') return 'admin_all';
    return 'global';
  };

  const currentChannel = getChannelName();

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel(`messages:${currentChannel}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const msg = payload.new as Message;
          const belongs = chatType === 'admin_all' || msg.channel === currentChannel;
          if (belongs) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const msg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
        } else if (payload.eventType === 'DELETE') {
          const id = payload.old.id;
          setMessages(prev => prev.filter(m => m.id !== id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChannel, chatType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    let query = supabase.from('messages').select('*');
    
    if (chatType !== 'admin_all') {
      query = query.eq('channel', currentChannel);
    }
    
    const { data } = await query
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) setMessages(data);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    const payload: any = {
      sender_username: user.username,
      sender_id: user.id,
      content: content,
      channel: currentChannel,
    };

    if (chatType === 'private') {
      payload.receiver_id = selectedUserId;
    }

    const { error } = await supabase.from('messages').insert([payload]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem.');
    }
  }

  async function handleDeleteMessage(id: string) {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) alert('Erro ao deletar mensagem.');
  }

  async function handleBulkDelete() {
    if (selectedMessages.length === 0) return;
    if (!confirm(`Deseja deletar ${selectedMessages.length} mensagens?`)) return;

    const { error } = await supabase.from('messages').delete().in('id', selectedMessages);
    if (!error) {
      setSelectedMessages([]);
      setIsBulkMode(false);
    } else {
      alert('Erro ao deletar mensagens em massa.');
    }
  }

  async function handleUpdateMessage() {
    if (!editingMessageId || !editContent.trim()) return;

    const { error } = await supabase
      .from('messages')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', editingMessageId);

    if (!error) {
      setEditingMessageId(null);
      setEditContent('');
    } else {
      alert('Erro ao editar mensagem.');
    }
  }

  const toggleMessageSelection = (id: string) => {
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.id && u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter areas based on user membership (unless Admin)
  const accessibleAreas = isAdmin 
    ? allAreas 
    : allAreas.filter(area => user?.areas?.some(ua => ua.id === area.id));

  return (
    <div className="h-screen flex bg-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-white font-bold flex items-center gap-2 text-lg">
            <Terminal className="w-5 h-5 text-emerald-500" />
            Canais & DMs
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Public Channels */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Canais Públicos</h3>
            <div className="space-y-1">
              <button
                onClick={() => setChatType('global')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  chatType === 'global' ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              
              {accessibleAreas.map(area => (
                <button
                  key={area.id}
                  onClick={() => {
                    setChatType('area');
                    setSelectedAreaId(area.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    chatType === 'area' && selectedAreaId === area.id ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Users className="w-4 h-4" />
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Groups */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Grupos</h3>
            <div className="space-y-1">
              {userGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    setChatType('group');
                    setSelectedGroupId(group.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    chatType === 'group' && selectedGroupId === group.id ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Hash className="w-4 h-4" />
                  {group.name}
                </button>
              ))}
              {userGroups.length === 0 && <p className="text-[10px] text-slate-600 px-3 italic">Nenhum grupo.</p>}
            </div>
          </div>

          {/* Admin View */}
          {isAdmin && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Administração</h3>
              <button
                onClick={() => setChatType('admin_all')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  chatType === 'admin_all' ? "bg-red-500 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Todas as Mensagens
              </button>
            </div>
          )}

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conversas Privadas</h3>
              <Search className="w-3 h-3 text-slate-500" />
            </div>
            <div className="mb-3 px-2">
              <input 
                type="text"
                placeholder="Buscar dev..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-slate-800 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setChatType('private');
                    setSelectedUserId(u.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    chatType === 'private' && selectedUserId === u.id ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              {chatType === 'global' && <Globe className="w-6 h-6 text-emerald-500" />}
              {chatType === 'area' && <Users className="w-6 h-6 text-emerald-500" />}
              {chatType === 'group' && <Hash className="w-6 h-6 text-emerald-500" />}
              {chatType === 'private' && <UserIcon className="w-6 h-6 text-emerald-500" />}
              {chatType === 'admin_all' && <Terminal className="w-6 h-6 text-red-500" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {chatType === 'global' && 'Canal Global'}
                {chatType === 'area' && `Área: ${currentArea?.name || 'Geral'}`}
                {chatType === 'group' && `Grupo: ${currentGroup?.name}`}
                {chatType === 'private' && `Chat com ${currentTargetUser?.username}`}
                {chatType === 'admin_all' && 'Monitoramento Global (Admin)'}
              </h1>
              <p className="text-xs text-slate-500">
                {chatType === 'admin_all' ? 'Visualizando todas as mensagens do sistema' : 'Mensagens em tempo real'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedMessages([]);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2",
                  isBulkMode ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                )}
              >
                {isBulkMode ? <X className="w-4 h-4" /> : <Trash className="w-4 h-4" />}
                {isBulkMode ? 'Cancelar Seleção' : 'Seleção em Massa'}
              </button>
            )}
            {isBulkMode && selectedMessages.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deletar ({selectedMessages.length})
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm italic">Nenhuma mensagem por aqui ainda...</p>
            </div>
          ) : messages.map((msg) => {
            const isOwn = msg.sender_username === user?.username;
            const isSelected = selectedMessages.includes(msg.id);

            return (
              <div 
                key={msg.id} 
                className={cn(
                  "group flex flex-col max-w-[85%] transition-all",
                  isOwn ? "ml-auto items-end" : "items-start",
                  isBulkMode && "cursor-pointer"
                )}
                onClick={() => isBulkMode && toggleMessageSelection(msg.id)}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  {isBulkMode && (
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      isSelected ? "bg-red-500 border-red-500" : "border-slate-700 bg-black"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {msg.sender_username}
                    {chatType === 'admin_all' && <span className="ml-2 text-slate-700">#{msg.channel}</span>}
                  </span>
                  <span className="text-[10px] text-slate-700 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.is_edited && (
                    <span className="text-[9px] text-slate-600 italic">(editada)</span>
                  )}
                </div>

                <div className="flex items-center gap-2 group/msg">
                  {isOwn && !isBulkMode && !editingMessageId && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-emerald-500 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!isOwn && isAdmin && !isBulkMode && (
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm relative",
                    isOwn 
                      ? "bg-emerald-500 text-black rounded-tr-none" 
                      : "bg-slate-900 text-white border border-slate-800 rounded-tl-none",
                    isSelected && "ring-2 ring-red-500 ring-offset-2 ring-offset-black"
                  )}>
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-black/20 border border-black/30 rounded-lg p-2 text-sm text-black focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMessageId(null)} className="p-1 hover:bg-black/10 rounded">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={handleUpdateMessage} className="p-1 hover:bg-black/10 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {chatType !== 'admin_all' && (
          <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 border-t border-slate-800">
            <div className="flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={chatType === 'private' ? `Mensagem privada para ${currentTargetUser?.username}...` : `Enviar mensagem para #${currentChannel}...`}
                className="flex-1 bg-black border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black p-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/10"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
