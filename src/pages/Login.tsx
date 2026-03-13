import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { LogIn, ShieldAlert } from 'lucide-react';
import { logAction } from '../lib/logger';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (isRegistering) {
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();

        if (existing) {
          setError('Este nome de usuário já está em uso.');
          return;
        }

        const { error: regError } = await supabase
          .from('users')
          .insert([{
            username,
            password,
            status: 'PENDING',
            role: 'DEVELOPER',
            can_edit_db: false,
            needs_password_change: false
          }]);

        if (regError) throw regError;

        await logAction('Solicitação de Acesso', 'AUTH', `Novo usuário ${username} solicitou acesso.`, 'system', 'system');
        setSuccess('Solicitação enviada! Aguarde a aprovação de um administrador.');
        setIsRegistering(false);
        setPassword('');
      } catch (err: any) {
        setError(`Erro ao solicitar acesso: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          user_areas (
            areas (*)
          )
        `)
        .eq('username', username)
        .eq('password', password)
        .single();

      if (fetchError || !data) {
        setError('Usuário ou senha incorretos.');
      } else {
        const userData = data as any;
        const user: User = {
          ...userData,
          areas: userData.user_areas?.map((ua: any) => ua.areas).filter(Boolean) || []
        };

        if (user.status === 'PENDING') {
          setError('Sua conta está pendente de aprovação.');
        } else if (user.status === 'DENIED') {
          setError('Seu acesso foi negado.');
        } else {
          await logAction('Login Realizado', 'AUTH', `Usuário ${user.username} entrou no sistema.`, user.id, user.username);
          login(user);
        }
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Roblox Dev Ops</h1>
          <p className="text-slate-400 text-sm">
            {isRegistering ? 'Solicite seu acesso ao sistema' : 'Acesse seu dashboard de desenvolvimento'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-3 text-red-500 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-3 flex items-center gap-3 text-emerald-500 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Processando...' : isRegistering ? 'Solicitar Acesso' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccess(null);
            }}
            className="text-sm text-slate-400 hover:text-emerald-500 transition-colors"
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Solicite acesso'}
          </button>
        </div>
      </div>
    </div>
  );
}
