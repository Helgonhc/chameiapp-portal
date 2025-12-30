'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Clock, AlertCircle, Check, Trash2, CheckCircle, Mail, MessageSquare } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Notification {
  id: string
  title: string
  message: string
  body?: string
  type: string
  is_read: boolean
  created_at: string
  link?: string
  data?: any
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (error) { console.error('Erro ao marcar como lida:', error) }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) { console.error('Erro ao marcar tudo como lido:', error) }
  }

  async function deleteNotification(id: string) {
    if (!confirm('Excluir notificação?')) return
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) { console.error('Erro ao excluir:', error) }
  }

  function getIcon(type: string) {
    if (type.includes('ticket')) return <AlertCircle className="w-5 h-5 text-warning-400" />
    if (type.includes('quote')) return <AlertCircle className="w-5 h-5 text-success-400" />
    if (type.includes('message') || type.includes('chat')) return <MessageSquare className="w-5 h-5 text-info-400" />
    return <Bell className="w-5 h-5 text-zinc-400" />
  }

  function getLink(n: Notification) {
    // Logic similar to Bell component
    const refId = n.data?.ticket_id || n.data?.quote_id || n.data?.order_id
    if (n.type.includes('ticket')) return `/tickets/${refId || ''}`
    if (n.type.includes('quote')) return `/quotes/${refId || ''}`
    return null
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="page-header">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="w-6 h-6 text-accent-400" /> Notificações</h1>
              <p className="text-zinc-400">Central de avisos e atualizações</p>
            </div>
            {notifications.some(n => !n.is_read) && (
              <button onClick={markAllAsRead} className="btn-secondary text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 -mt-6 pb-10">
          <div className="flex gap-2 bg-surface rounded-xl p-1 mb-6 border border-white/5 w-fit">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>Todas</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}>Não Lidas</button>
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notificação encontrada.</p>
              </div>
            ) : (
              filtered.map(n => (
                <div key={n.id} className={`list-item ${!n.is_read ? 'bg-surface-light border-l-4 border-l-accent-400' : 'opacity-80'}`}>
                  <div className="flex gap-4">
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-semibold text-white ${!n.is_read ? 'text-accent-100' : ''}`}>{n.title}</h3>
                        <span className="text-xs text-zinc-500">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString().slice(0, 5)}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">{n.body || n.message}</p>

                      <div className="flex gap-4 mt-3">
                        {getLink(n) && (
                          <button onClick={() => { markAsRead(n.id); router.push(getLink(n)!) }} className="text-xs font-bold text-accent-400 hover:underline cursor-pointer">
                            Ver Detalhes
                          </button>
                        )}
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
                            <Check className="w-3 h-3" /> Marcar como lida
                          </button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="text-xs text-danger-400 hover:text-danger-300 ml-auto flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
