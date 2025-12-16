'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Check, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'quote' | 'ticket' | 'chat' | 'system'
  read: boolean
  created_at: string
  link?: string
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      // Mapear notificações
      const mappedNotifications: Notification[] = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: getNotificationType(n.type),
        read: n.read || false,
        created_at: n.created_at,
        link: getNotificationLink(n),
      }))

      setNotifications(mappedNotifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  function getNotificationType(type: string): 'order' | 'quote' | 'ticket' | 'chat' | 'system' {
    if (type.includes('order') || type.includes('service')) return 'order'
    if (type.includes('quote') || type.includes('orcamento')) return 'quote'
    if (type.includes('ticket') || type.includes('chamado')) return 'ticket'
    if (type.includes('chat') || type.includes('message')) return 'chat'
    return 'system'
  }

  function getNotificationLink(notification: any): string | undefined {
    if (notification.service_order_id) return `/service-orders/${notification.service_order_id}`
    if (notification.quote_id) return `/quotes/${notification.quote_id}`
    if (notification.ticket_id) return `/tickets`
    return undefined
  }

  async function markAsRead(notificationId: string) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  async function markAllAsRead() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('client_id', profile.client_id)
        .eq('read', false)

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
      setShowPanel(false)
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'order':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'quote':
        return <AlertCircle className="w-5 h-5 text-purple-600" />
      case 'ticket':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'chat':
        return <AlertCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-slate-600" />
    }
  }

  function getTimeAgo(date: string): string {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / 60000)

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return notificationDate.toLocaleDateString('pt-BR')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      {/* Botão do Sino */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-slate-100 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Painel */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Notificações</h3>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo lido'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-all ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm text-slate-900 line-clamp-1">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    router.push('/notifications')
                    setShowPanel(false)
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
