'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Zap } from 'lucide-react'

interface ClientBranding {
  name: string
  company_name: string
  logo_url: string | null
  primary_color: string
  portal_welcome_message: string | null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [branding, setBranding] = useState<ClientBranding | null>(null)
  const [loadingBranding, setLoadingBranding] = useState(true)

  useEffect(() => { loadClientBranding() }, [])

  async function loadClientBranding() {
    try {
      const { data, error } = await supabase.from('clients')
        .select('name, company_name, logo_url, primary_color, portal_welcome_message')
        .eq('is_active', true).eq('portal_enabled', true).limit(1).single()
      if (error) {
        setBranding({ name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente', company_name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
          logo_url: `/logos/${process.env.NEXT_PUBLIC_CLIENT_LOGO || 'client-logo.png'}`, primary_color: `#${process.env.NEXT_PUBLIC_CLIENT_COLOR || '6366f1'}`, portal_welcome_message: null })
      } else { setBranding(data) }
    } catch (error) { console.error('Erro ao carregar branding:', error) }
    finally { setLoadingBranding(false) }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: profile } = await supabase.from('profiles').select('role, client_id, is_active').eq('id', data.user.id).single()
      if (profile?.role !== 'client') { await supabase.auth.signOut(); throw new Error('Acesso negado. Este portal é apenas para clientes.') }
      if (profile.is_active === false) { await supabase.auth.signOut(); throw new Error('Sua conta está desativada.') }
      if (profile.client_id) {
        const { data: client } = await supabase.from('clients').select('portal_blocked, portal_blocked_reason').eq('id', profile.client_id).single()
        if (client?.portal_blocked) { await supabase.auth.signOut(); throw new Error(client.portal_blocked_reason || 'Acesso bloqueado.') }
      }
      router.push('/dashboard')
    } catch (error: any) { setError(error.message) }
    finally { setLoading(false) }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault(); setResetLoading(true); setError(''); setSuccess('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` })
      if (error) throw error
      setSuccess('Email enviado! Verifique sua caixa.'); setResetEmail('')
      setTimeout(() => { setShowResetPassword(false); setSuccess('') }, 3000)
    } catch (error: any) { setError(error.message) }
    finally { setResetLoading(false) }
  }

  if (loadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="card p-8 border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            {branding?.logo_url && (
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-xl opacity-40"></div>
                <div className="relative w-full h-full rounded-2xl p-3 flex items-center justify-center border border-white/10" style={{ backgroundColor: '#1a1a2e' }}>
                  <Image src={branding.logo_url} alt={branding.name} fill className="object-contain p-2" priority />
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent-400" />
              <h1 className="text-2xl font-bold text-white">Bem-vindo!</h1>
            </div>
            <p className="text-zinc-400 text-sm">{branding?.portal_welcome_message || `Portal ${branding?.name}`}</p>
          </div>

          {!showResetPassword ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="info-box info-box-red"><p className="text-sm font-medium whitespace-pre-line">{error}</p></div>}

              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input pl-12" placeholder="seu@email.com" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Senha</label>
                  <button type="button" onClick={() => setShowResetPassword(true)} className="text-xs text-primary-400 font-semibold hover:text-primary-300 transition-colors">Esqueci</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input pl-12 pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span>Entrar</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && <div className="info-box info-box-red text-sm">{error}</div>}
              {success && <div className="info-box info-box-green text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />{success}</div>}
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Redefinir Senha</h2>
                <p className="text-sm text-zinc-400 mb-4">Digite seu email para receber o link.</p>
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="form-input pl-12" placeholder="seu@email.com" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowResetPassword(false); setError(''); setSuccess('') }} className="btn-secondary flex-1">Voltar</button>
                <button type="submit" disabled={resetLoading} className="btn-primary flex-1">{resetLoading ? 'Enviando...' : 'Enviar'}</button>
              </div>
            </form>
          )}

          {!showResetPassword && (
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">Não tem conta? <button onClick={() => router.push('/register')} className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">Criar</button></p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-600">Powered by <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">ChameiApp</span></p>
        </div>
      </div>
    </div>
  )
}
