import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DataStoreItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Database, 
  Search, 
  Edit3, 
  Save, 
  X, 
  AlertCircle,
  Code
} from 'lucide-react';

export default function DataStore() {
  const [items, setItems] = useState<DataStoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string, key: string, value: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDataStore();
  }, []);

  async function fetchDataStore() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('datastore')
      .select('*')
      .order('key', { ascending: true });
    
    if (!error && data) {
      setItems(data);
    }
    setIsLoading(false);
  }

  function handleEdit(item: DataStoreItem) {
    if (!user?.can_edit_db) return;
    setEditingItem({
      id: item.id,
      key: item.key,
      value: JSON.stringify(item.value, null, 2)
    });
    setError(null);
  }

  async function handleSave() {
    if (!editingItem) return;

    try {
      const parsedValue = JSON.parse(editingItem.value);
      
      const { error: updateError } = await supabase
        .from('datastore')
        .update({ value: parsedValue })
        .eq('id', editingItem.id);

      if (updateError) throw updateError;

      setEditingItem(null);
      fetchDataStore();
    } catch (err) {
      setError('JSON inválido. Verifique a sintaxe.');
    }
  }

  const filteredItems = items.filter(item => 
    item.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">DataStore Explorer</h1>
          <p className="text-slate-400 mt-2">Gerencie chaves e valores do banco de dados do jogo.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
      </header>

      {!user?.can_edit_db && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/50 rounded-xl p-4 flex items-center gap-3 text-blue-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Você tem apenas permissão de visualização. Contate um administrador para habilitar a edição.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Carregando DataStore...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Nenhum item encontrado.</div>
        ) : filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between group hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-white font-bold font-mono">{item.key}</h3>
                <p className="text-slate-500 text-xs mt-1">JSON Object</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:block max-w-md truncate text-slate-400 text-sm font-mono bg-black/40 px-3 py-1 rounded border border-slate-800">
                {JSON.stringify(item.value)}
              </div>
              <button 
                onClick={() => handleEdit(item)}
                disabled={!user?.can_edit_db}
                className={`p-2 rounded-lg transition-colors ${
                  user?.can_edit_db 
                    ? 'hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500' 
                    : 'opacity-20 cursor-not-allowed text-slate-600'
                }`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white">Editar: {editingItem.key}</h2>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">JSON Editor</span>
                {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
              </div>
              <textarea
                value={editingItem.value}
                onChange={(e) => {
                  setEditingItem({ ...editingItem, value: e.target.value });
                  setError(null);
                }}
                className="w-full h-80 bg-black border border-slate-700 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 resize-none"
                spellCheck={false}
              />
            </div>

            <div className="p-6 bg-black/20 border-t border-slate-800 flex justify-end gap-4">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
