'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, FileText, DollarSign, AlertCircle, MessageSquare } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: any
  is_read: boolean
  created_at: string
  order_id?: string
  quote_id?: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    checkAuth()
    loadNotifications()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  async function deleteAllRead() {
    if (!confirm('Deseja excluir todas as notificações lidas? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao deletar notificações:', error)
      alert('Erro ao excluir notificações')
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)
    
    if (notification.order_id) {
      router.push(`/order/${notification.order_id}`)
    } else if (notification.quote_id) {
      router.push(`/quotes/${notification.quote_id}`)
    }
  }

  function getNotificationIcon(type: string) {
    const icons = {
      new_order: <FileText className="w-5 h-5" />,
      order_updated: <AlertCircle className="w-5 h-5" />,
      order_completed: <CheckCheck className="w-5 h-5" />,
      quote_created: <DollarSign className="w-5 h-5" />,
      quote_approved: <Check className="w-5 h-5" />,
      quote_rejected: <AlertCircle className="w-5 h-5" />,
      message: <MessageSquare className="w-5 h-5" />,
      system: <Bell className="w-5 h-5" />,
    }
    return icons[type as keyof typeof icons] || <Bell className="w-5 h-5" />
  }

  function getNotificationColor(type: string) {
    const colors = {
      new_order: 'bg-blue-100 text-blue-600',
      order_updated: 'bg-purple-100 text-purple-600',
      order_completed: 'bg-green-100 text-green-600',
      quote_created: 'bg-amber-100 text-amber-600',
      quote_approved: 'bg-emerald-100 text-emerald-600',
      quote_rejected: 'bg-red-100 text-red-600',
      message: 'bg-cyan-100 text-cyan-600',
      system: 'bg-slate-100 text-slate-600',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Notificações</h1>
                <p className="text-sm text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar todas como lidas</span>
                  <span className="sm:hidden">Marcar</span>
                </button>
              )}
              
              {notifications.filter(n => n.is_read).length > 0 && (
                <button
                  onClick={deleteAllRead}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpar lidas</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'unread'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </p>
              <p className="text-sm text-slate-500">
                {filter === 'unread' ? 'Você está em dia!' : 'Quando houver novidades, elas aparecerão aqui'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer overflow-hidden ${
                  notification.is_read
                    ? 'border-slate-200/60 hover:border-slate-300'
                    : 'border-blue-300 hover:border-blue-400 bg-blue-50/30'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Ícone */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900 text-base">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(notification.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
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
  )
}
