'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Zap, Shield, Clock, FileText, Wrench } from 'lucide-react';

interface ClientBranding {
  name: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  portal_welcome_message: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [branding, setBranding] = useState<ClientBranding | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(true);

  useEffect(() => {
    loadClientBranding();
  }, []);

  async function loadClientBranding() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('name, company_name, logo_url, primary_color, portal_welcome_message')
        .eq('is_active', true)
        .eq('portal_enabled', true)
        .limit(1)
        .single();
      if (error) {
        setBranding({
          name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
          company_name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
          logo_url: `/logos/${process.env.NEXT_PUBLIC_CLIENT_LOGO || 'client-logo.png'}`,
          primary_color: `#${process.env.NEXT_PUBLIC_CLIENT_COLOR || '6366f1'}`,
          portal_welcome_message: null,
        });
      } else {
        setBranding(data);
      }
    } catch (error) {
      console.error('Erro ao carregar branding:', error);
    } finally {
      setLoadingBranding(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
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
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess('Email enviado! Verifique sua caixa.');
      setResetEmail('');
      setTimeout(() => {
        setShowResetPassword(false);
        setSuccess('');
      }, 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResetLoading(false);
    }
  }

  if (loadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[150px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-[100px]"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Branding */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
          <div className="max-w-md w-full text-center lg:text-left">
            {/* Company Logo/Icon */}
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-2xl opacity-40 scale-110"></div>
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  {branding?.logo_url ? (
                    <Image
                      src={branding.logo_url}
                      alt={branding.name}
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  ) : (
                    <Zap className="w-12 h-12 lg:w-16 lg:h-16 text-primary-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Company Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent">
                AEC Serviços Especializados
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-lg lg:text-xl text-zinc-400 mb-8">
              Portal de Gerenciamento de Ordens de Serviço
            </p>

            {/* Features */}
            <div className="hidden lg:grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ordens de Serviço</p>
                  <p className="text-xs text-zinc-500">Acompanhe em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Manutenções</p>
                  <p className="text-xs text-zinc-500">Preventivas e corretivas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Agendamentos</p>
                  <p className="text-xs text-zinc-500">Solicite datas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Segurança</p>
                  <p className="text-xs text-zinc-500">Dados protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="card p-8 border border-white/10 backdrop-blur-xl bg-surface/80">
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
                <p className="text-zinc-400 text-sm">
                  {branding?.portal_welcome_message || 'Acesse sua conta para gerenciar suas ordens de serviço'}
                </p>
              </div>

              {!showResetPassword ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <div className="info-box info-box-red">
                      <p className="text-sm font-medium whitespace-pre-line">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input pl-12"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Senha</label>
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-xs text-primary-400 font-semibold hover:text-primary-300 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input pl-12 pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base font-semibold"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Entrar no Portal</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {error && <div className="info-box info-box-red text-sm">{error}</div>}
                  {success && (
                    <div className="info-box info-box-green text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {success}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Redefinir Senha</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                      Digite seu email para receber o link de redefinição.
                    </p>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="form-input pl-12"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setError('');
                        setSuccess('');
                      }}
                      className="btn-secondary flex-1"
                    >
                      Voltar
                    </button>
                    <button type="submit" disabled={resetLoading} className="btn-primary flex-1">
                      {resetLoading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                  </div>
                </form>
              )}

              {!showResetPassword && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-zinc-500">
                    Não tem conta?{' '}
                    <button
                      onClick={() => router.push('/register')}
                      className="text-primary-400 font-semibold hover:text-primary-300 transition-colors"
                    >
                      Criar conta
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-white/5">
        <p className="text-xs text-zinc-600">
          Desenvolvido por{' '}
          <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Helgon Henrique
          </span>
        </p>
      </footer>
    </div>
  );
}
