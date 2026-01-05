'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, AlertCircle, Sparkles, Zap, Shield, Clock, FileText, Wrench, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/dashboard');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id, is_active')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'client') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Este portal é apenas para clientes.');
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Sua conta está desativada.');
      }

      if (profile.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('portal_blocked, portal_blocked_reason')
          .eq('id', profile.client_id)
          .single();

        if (client?.portal_blocked) {
          await supabase.auth.signOut();
          throw new Error(client.portal_blocked_reason || 'Acesso bloqueado.');
        }
      }

      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Informe seu email');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Email de redefinição enviado!');
      setShowResetPassword(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Lado Esquerdo - Intro da Plataforma (Oculto em Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0f172a]">
        <img
          src="/auth-bg.png"
          alt="Eletricom OS Client"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay Indigo para unificar com a marca */}
        <div className="absolute inset-0 bg-indigo-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0f172a]/20 to-[#0f172a]" />

        {/* Conteúdo sobre a imagem - Estilo Premium com Informações */}
        <div className="relative z-10 flex flex-col justify-center p-20 text-white h-full">
          <div className="max-w-md space-y-12">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col mb-4">
                <img
                  src="/logo-official.png"
                  alt="Eletricom-OS"
                  className="w-64 h-auto object-contain mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-px bg-indigo-500" />
                  <span className="text-[10px] uppercase tracking-[4px] text-white font-black opacity-80">
                    Portal do Cliente
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-4xl font-bold leading-tight">
                Toda a gestão técnica da sua empresa em <span className="text-indigo-400">suas mãos.</span>
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors backdrop-blur-sm">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white/90">Acompanhamento Real</h4>
                    <p className="text-slate-300/80 text-sm leading-relaxed">Visualize o status de suas Ordens de Serviço em tempo real, do início à conclusão.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors backdrop-blur-sm">
                    <Wrench className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white/90">Gestão de Equipamentos</h4>
                    <p className="text-slate-300/80 text-sm leading-relaxed">Histórico completo de manutenções e documentação técnica de cada ativo.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors backdrop-blur-sm">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white/90">Solicitações Rápidas</h4>
                    <p className="text-slate-300/80 text-sm leading-relaxed">Agende manutenções e preventivas diretamente pela plataforma com facilidade.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative bg-[#0f172a]">
        {/* Background blobs sutis */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[80px] -ml-32 -mb-32" />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="flex flex-col items-center text-center">
            <img
              src="/logo-official.png"
              alt="Eletricom-OS"
              className="w-48 h-auto object-contain mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-[3px]">Acesso ao Cliente</span>
            </div>

            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              BEM-VINDO
            </h1>
            <p className="text-slate-400 font-light tracking-wide">
              {showResetPassword ? 'Recupere seu acesso à plataforma' : 'Acesse o portal do cliente da Eletricom'}
            </p>
          </div>

          {!showResetPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="group">
                  <label className="text-sm font-semibold text-slate-300 ml-1 block mb-2 group-focus-within:text-indigo-400 transition-colors font-inter">
                    Email de Acesso
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                      placeholder="seu@email.com"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-semibold text-slate-300 ml-1 block mb-2 group-focus-within:text-indigo-400 transition-colors font-inter">
                    Sua Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm py-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="w-5 h-5 border-2 border-white/10 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all" />
                    <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-200 transition-colors">Lembrar acesso</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={22} />
                    <span>Entrar no Portal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="group">
                <label className="text-sm font-semibold text-slate-300 ml-1 block mb-2 group-focus-within:text-indigo-400 transition-colors font-inter">
                  Email Cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full h-14 pl-12 pr-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                    placeholder="seu@email.com"
                    disabled={resetLoading}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
                  disabled={resetLoading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-600/30 transition-all"
                >
                  {resetLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Enviar Link'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Ainda não tem acesso? <br className="md:hidden" />
              <button
                onClick={() => router.push('/register')}
                className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-1"
              >
                Solicite sua conta
              </button>
            </p>
          </div>

          {/* Footer Minimalista */}
          <div className="pt-8 text-center border-t border-white/5">
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-[2px]">
              © {new Date().getFullYear()} Eletricom-OS-Cliente — Intelligent Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
