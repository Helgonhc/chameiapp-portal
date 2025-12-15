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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Logos */}
          <div className="text-center mb-6">
            {/* Logo Empresa Cliente - DESTAQUE */}
            <div className="mb-3">
              {branding?.logo_url && (
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <Image
                    src={branding.logo_url}
                    alt={`Logo ${branding.name}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
              <h1 className="text-lg font-bold text-gray-900">Bem-vindo!</h1>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                {branding?.portal_welcome_message || `Portal de Chamados da ${branding?.name || 'Empresa'}`}
              </p>
              <p className="text-gray-500 text-xs mt-1">Acesse sua conta para continuar</p>
            </div>

            {/* Divisor com Powered by */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">Powered by</span>
                <span className="font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  ChameiApp
                </span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link Criar Conta */}
          <div className="mt-4 text-center text-xs text-gray-600">
            <span>Não tem uma conta? </span>
            <button
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé com Créditos */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} ChameiApp. Todos os direitos reservados.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Desenvolvido por <span className="font-semibold text-gray-700">Helgon Henrique</span>
        </p>
      </div>
    </div>
  )
}
