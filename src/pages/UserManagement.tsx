import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role, Area } from '../types';
import { generateRandomPassword } from '../lib/utils';
import { 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  X,
  Copy,
  Search,
  Shield,
  Layers
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetModal, setResetModal] = useState<{ isOpen: boolean, username: string, password?: string }>({ isOpen: false, username: '' });

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username', { ascending: true });
    
    if (!error && data) {
      setUsers(data);
    }
    setIsLoading(false);
  }

  async function fetchMetadata() {
    const [rolesRes, areasRes] = await Promise.all([
      supabase.from('roles').select('*'),
      supabase.from('areas').select('*')
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (areasRes.data) setAreas(areasRes.data);
  }

  async function handleStatusChange(userId: string, status: User['status']) {
    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    }
  }

  async function handleRoleChange(userId: string, roleId: string) {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const { error } = await supabase
      .from('users')
      .update({ role_id: roleId, role: role.name })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role_id: roleId, role: role.name } : u));
    }
  }

  async function handleAreaChange(userId: string, areaId: string) {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    const { error } = await supabase
      .from('users')
      .update({ area_id: areaId, area: area.name })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, area_id: areaId, area: area.name } : u));
    }
  }

  async function handleResetPassword(userId: string, username: string) {
    const newPassword = generateRandomPassword(8);
    const { error } = await supabase
      .from('users')
      .update({ 
        password: newPassword, 
        needs_password_change: true 
      })
      .eq('id', userId);
    
    if (!error) {
      setResetModal({ isOpen: true, username, password: newPassword });
      fetchUsers();
    }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de Usuários</h1>
          <p className="text-slate-400 mt-2">Gerencie permissões e acessos da equipe.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/50 border-b border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Área</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Edição DB</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Carregando usuários...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Nenhum usuário encontrado.</td>
              </tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-black/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-500">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role_id || ''}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-black border border-slate-800 rounded px-2 py-1 text-[10px] font-bold uppercase text-emerald-500 focus:outline-none"
                  >
                    <option value="">SEM CARGO</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.area_id || ''}
                    onChange={(e) => handleAreaChange(u.id, e.target.value)}
                    className="bg-black border border-slate-800 rounded px-2 py-1 text-[10px] font-bold uppercase text-blue-500 focus:outline-none"
                  >
                    <option value="">SEM ÁREA</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      u.status === 'APPROVED' ? 'bg-emerald-500' : 
                      u.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-slate-300">{u.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${u.can_edit_db ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {u.can_edit_db ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {u.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(u.id, 'APPROVED')}
                          className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(u.id, 'DENIED')}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                          title="Negar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleResetPassword(u.id, u.username)}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Resetar Senha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Senha Resetada</h2>
              <p className="text-slate-400 text-sm mt-2">
                A senha para <strong>{resetModal.username}</strong> foi atualizada.
              </p>
              
              <div className="w-full mt-6 bg-black border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <code className="text-emerald-500 font-mono font-bold text-lg">{resetModal.password}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(resetModal.password || '');
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">
                O usuário deverá trocar a senha no próximo login.
              </p>

              <button 
                onClick={() => setResetModal({ isOpen: false, username: '' })}
                className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
