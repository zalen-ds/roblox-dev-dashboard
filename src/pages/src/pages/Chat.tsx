import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Send, Globe, Users, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channel, setChannel] = useState<'global' | 'area'>('global');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannel = channel === 'global' ? 'global' : user?.area || 'Geral';

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel=eq.${currentChannel}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', currentChannel)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) setMessages(data);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageData = {
      sender_username: user.username,
      content: newMessage.trim(),
      channel: currentChannel
    };

    const { error } = await supabase.from('messages').insert([messageData]);
    if (!error) setNewMessage('');
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-500" />
            Comunicação Dev Ops
          </h1>
          <p className="text-slate-400 text-sm mt-1">Chat em tempo real para a equipe.</p>
        </div>
        
        <div className="flex bg-black p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setChannel('global')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              channel === 'global' ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Globe className="w-4 h-4" />
            Global
          </button>
          <button
            onClick={() => setChannel('area')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              channel === 'area' ? "bg-emerald-500 text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Área ({user?.area})
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[80%]",
              msg.sender_username === user?.username ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {msg.sender_username}
              </span>
              <span className="text-[10px] text-slate-700 font-mono">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-2xl text-sm",
              msg.sender_username === user?.username 
                ? "bg-emerald-500 text-black rounded-tr-none" 
                : "bg-slate-900 text-white border border-slate-800 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 border-t border-slate-800">
        <div className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Enviar mensagem para #${currentChannel}...`}
            className="flex-1 bg-black border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black p-3 rounded-xl transition-colors"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}
