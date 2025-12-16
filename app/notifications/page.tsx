'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Check, CheckCheck, Trash2, FileText, DollarSign, AlertCircle, MessageSquare } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

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
      system: 'bg-gray-100 text-gray-600',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando notificações...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Notificações</h1>
                  <p className="text-red-100 text-sm sm:text-base md:text-lg mt-0.5 sm:mt-1">
                    {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia! 🎉'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-red-600 rounded-lg sm:rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Marcar todas</span>
                    <span className="sm:hidden">Marcar</span>
                  </button>
                )}
                
                {notifications.filter(n => n.is_read).length > 0 && (
                  <button
                    onClick={deleteAllRead}
                    className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-white bg-opacity-20 text-white rounded-lg sm:rounded-xl font-bold hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Limpar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-6 sm:pb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { key: 'all', label: 'Todas', count: notifications.length, icon: '📬' },
              { key: 'unread', label: 'Não lidas', count: unreadCount, icon: '🔔' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg text-xs sm:text-sm md:text-base ${
                  filter === btn.key
                    ? 'bg-white text-red-600 shadow-xl border-2 border-red-200'
                    : 'bg-white text-gray-600 hover:shadow-xl border-2 border-transparent'
                }`}
              >
                <span className="mr-1 sm:mr-2">{btn.icon}</span>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="space-y-2 sm:space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 text-center">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {filter === 'unread' ? 'Você está em dia!' : 'Quando houver novidades, elas aparecerão aqui'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group bg-white rounded-xl sm:rounded-2xl shadow-lg border transition-all cursor-pointer ${
                    notification.is_read
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-blue-300 hover:border-blue-400 bg-blue-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-3 sm:p-5">
                    <div className="flex gap-2 sm:gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
