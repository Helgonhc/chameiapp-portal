'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [branding, setBranding] = useState<ClientBranding | null>(null)
  const [loadingBranding, setLoadingBranding] = useState(true)

  useEffect(() => {
    loadClientBranding()
  }, [])

  async function loadClientBranding() {
    try {
      // Buscar o primeiro cliente ativo (ou você pode usar subdomain/env var)
      const { data, error } = await supabase
        .from('clients')
        .select('name, company_name, logo_url, primary_color, portal_welcome_message')
        .eq('is_active', true)
        .eq('portal_enabled', true)
        .limit(1)
        .single()

      if (error) {
        console.error('Erro ao carregar branding:', error)
        // Usar valores padrão do .env.local se falhar
        setBranding({
          name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
          company_name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Portal do Cliente',
          logo_url: `/logos/${process.env.NEXT_PUBLIC_CLIENT_LOGO || 'client-logo.png'}`,
          primary_color: `#${process.env.NEXT_PUBLIC_CLIENT_COLOR || '0066cc'}`,
          portal_welcome_message: null
        })
      } else {
        setBranding(data)
      }
    } catch (error) {
      console.error('Erro ao carregar branding:', error)
    } finally {
      setLoadingBranding(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verificar se é cliente e se está bloqueado
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id, is_active')
        .eq('id', data.user.id)
        .single()

      if (profile?.role !== 'client') {
        await supabase.auth.signOut()
        throw new Error('Acesso negado. Este portal é apenas para clientes.')
      }

      // Verificar se o perfil está ativo
      if (profile.is_active === false) {
        await supabase.auth.signOut()
        throw new Error('Sua conta está desativada. Entre em contato com o suporte.')
      }

      // Verificar se o cliente está bloqueado
      if (profile.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('portal_blocked, portal_blocked_reason')
          .eq('id', profile.client_id)
          .single()

        if (client?.portal_blocked) {
          await supabase.auth.signOut()
          const reason = client.portal_blocked_reason || 'Seu acesso ao portal foi bloqueado.'
          throw new Error(`🔒 Acesso Bloqueado\n\n${reason}\n\nEntre em contato com o suporte para mais informações.`)
        }
      }

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 relative overflow-hidden">
      {/* Efeitos de fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-200/60">
          {/* Logos */}
          <div className="text-center mb-8">
            {/* Logo Empresa Cliente - DESTAQUE */}
            <div className="mb-6">
              {branding?.logo_url && (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full blur opacity-20"></div>
                  <Image
                    src={branding.logo_url}
                    alt={`Logo ${branding.name}`}
                    fill
                    className="object-contain relative z-10"
                    priority
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo de volta!</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                {branding?.portal_welcome_message || `Portal de Chamados da ${branding?.name || 'Empresa'}`}
              </p>
            </div>

            {/* Divisor com Powered by */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Powered by</span>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ChameiApp
                </span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-xl border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-xl">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">{loading ? 'Entrando...' : 'Entrar no Portal'}</span>
            </button>
          </form>

          {/* Link Criar Conta */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Não tem uma conta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé com Créditos */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} ChameiApp. Todos os direitos reservados.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Desenvolvido por <span className="font-semibold text-slate-700">Helgon Henrique</span>
        </p>
      </div>
    </div>
  )
}
