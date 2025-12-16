'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bell, Check, CheckCheck, Trash2, Filter, FileText, DollarSign, AlertCircle, MessageSquare, Sparkles } from 'lucide-react'
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
              <Bell className="w-6 h-6 text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando notificações...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-8 py-12">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Notificações</h1>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="group relative px-5 py-3 bg-white text-red-600 rounded-xl font-bold hover:shadow-2xl hover:shadow-white/50 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center gap-2">
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Marcar todas</span>
                      <span className="sm:hidden">Marcar</span>
                    </div>
                  </button>
                )}
                
                {notifications.filter(n => n.is_read).length > 0 && (
                  <button
                    onClick={deleteAllRead}
                    className="group relative px-5 py-3 bg-white/20 backdrop-blur-xl text-white rounded-xl font-bold hover:bg-white/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Limpar</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
            <p className="text-red-100 text-lg">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia! 🎉'}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8 pb-8">
        {/* Filtros Premium */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'all', label: 'Todas', count: notifications.length, icon: '📬' },
            { key: 'unread', label: 'Não lidas', count: unreadCount, icon: '🔔' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              className={`group px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-sm ${
                filter === btn.key
                  ? 'bg-white text-red-600 shadow-lg border-2 border-red-200 scale-105'
                  : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md border-2 border-transparent'
              }`}
            >
              <span className="mr-2">{btn.icon}</span>
              {btn.label} ({btn.count})
            </button>
          ))}
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
        </div>
      </div>
    </DashboardLayout>
  )
}
