'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [clientData, setClientData] = useState<any>(null)
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
      .select('client_id')
      .eq('id', user.id)
      .single()

    if (profile?.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profile.client_id)
        .single()
      
      if (client) setClientData(client)
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        clientData={clientData}
        unreadNotifications={unreadNotifications}
        pendingQuotes={pendingQuotes}
      />
      <main className="flex-1 overflow-y-auto">
        {/* Header com dados do cliente e NotificationBell */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between shadow-lg">
          {/* Dados do Cliente */}
          <div className="flex items-center gap-4">
            {clientData?.client_logo_url ? (
              <img 
                src={clientData.client_logo_url} 
                alt={clientData.name}
                className="w-12 h-12 rounded-lg bg-white p-1 object-contain shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-md">
                <span className="text-2xl font-bold text-blue-600">
                  {clientData?.name?.[0] || '?'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">
                {clientData?.name || 'Carregando...'}
              </h1>
              {clientData?.responsible_name && (
                <p className="text-sm text-blue-100">
                  👤 {clientData.responsible_name}
                </p>
              )}
            </div>
          </div>

          {/* NotificationBell */}
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  )
}
