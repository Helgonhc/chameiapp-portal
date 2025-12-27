'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { Building2, Sparkles } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [clientData, setClientData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [pendingQuotes, setPendingQuotes] = useState(0)
  const { unreadCount: unreadNotifications } = useRealtimeNotifications()

  useEffect(() => {
    checkAuth()
    loadPendingQuotes()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, client_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role !== 'client') {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }
      setUserData(profile)

      if (profile.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profile.client_id)
          .single()

        if (client) setClientData(client)
      }
    }
  }

  async function loadPendingQuotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .eq('status', 'pending')

      setPendingQuotes(count || 0)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        clientData={clientData}
        userData={userData}
        unreadNotifications={unreadNotifications}
        pendingQuotes={pendingQuotes}
      />
      <main className="flex-1 overflow-y-auto">
        {/* Header Premium */}
        <header className="sticky top-0 z-30 header-gradient px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Client Info */}
            <div className="flex items-center gap-4 ml-14 lg:ml-0">
              {clientData?.client_logo_url ? (
                <div className="w-11 h-11 rounded-xl bg-white/5 backdrop-blur-sm p-1.5 flex items-center justify-center border border-white/10">
                  <img
                    src={clientData.client_logo_url}
                    alt={clientData.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-white/10">
                  <Building2 className="w-5 h-5 text-primary-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white">
                    {clientData?.name || 'Carregando...'}
                  </h1>
                  <Sparkles className="w-4 h-4 text-accent-400" />
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500 status-online"></span>
                  {userData?.email === clientData?.email
                    ? (clientData?.responsible_name || userData?.full_name || 'Responsável')
                    : (userData?.full_name || 'Usuário')
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="min-h-[calc(100vh-72px)]">
          {children}
        </div>
      </main>
    </div>
  )
}
