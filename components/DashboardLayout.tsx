'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'
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
        {children}
      </main>
    </div>
  )
}
