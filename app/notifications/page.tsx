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
  reference_id?: string
  order_id?: string
  quote_id?: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => { checkAuth(); loadNotifications() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setNotifications(data || [])
    } catch (error) { console.error('Erro ao carregar notificações:', error) }
    finally { setLoading(false) }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notificationId)
      if (error) throw error
      await loadNotifications()
    } catch (error) { console.error('Erro ao marcar como lida:', error) }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false)
      if (error) throw error
      await loadNotifications()
    } catch (error) { console.error('Erro ao marcar todas como lidas:', error) }
  }

  async function deleteAllRead() {
    if (!confirm('Deseja excluir todas as notificações lidas?')) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id).eq('is_read', true)
      if (error) throw error
      await loadNotifications()
    } catch (error) { console.error('Erro ao deletar notificações:', error); alert('Erro ao excluir notificações') }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
      if (error) { alert('Erro ao excluir notificação: ' + error.message); return }
      await loadNotifications()
    } catch (error: any) { alert('Erro ao excluir notificação: ' + (error?.message || 'Erro desconhecido')) }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)
    const refId = notification.reference_id || notification.data?.reference_id || notification.order_id || notification.quote_id
    switch (notification.type) {
      case 'quote': case 'quote_created': case 'quote_approved': case 'quote_rejected': if (refId) router.push(`/quotes/${refId}`); break
      case 'order': case 'new_order': case 'order_updated': case 'order_completed': case 'service_order': if (refId) router.push(`/orders/${refId}`); break
      case 'ticket': case 'new_ticket': case 'ticket_updated': if (refId) router.push(`/tickets/${refId}`); break
      case 'appointment': case 'appointment_confirmed': case 'appointment_cancelled': router.push(`/appointments`); break
      default: if (notification.order_id) router.push(`/orders/${notification.order_id}`); else if (notification.quote_id) router.push(`/quotes/${notification.quote_id}`)
    }
  }

  function getNotificationIcon(type: string) {
    const icons: Record<string, JSX.Element> = {
      new_order: <FileText className="w-5 h-5" />, order_updated: <AlertCircle className="w-5 h-5" />, order_completed: <CheckCheck className="w-5 h-5" />,
      quote_created: <DollarSign className="w-5 h-5" />, quote_approved: <Check className="w-5 h-5" />, quote_rejected: <AlertCircle className="w-5 h-5" />,
      message: <MessageSquare className="w-5 h-5" />, system: <Bell className="w-5 h-5" />,
    }
    return icons[type] || <Bell className="w-5 h-5" />
  }

  function getNotificationColor(type: string) {
    const colors: Record<string, string> = {
      new_order: 'bg-primary-500/20 text-primary-400', order_updated: 'bg-purple-500/20 text-purple-400', order_completed: 'bg-success-500/20 text-success-400',
      quote_created: 'bg-accent-500/20 text-accent-400', quote_approved: 'bg-success-500/20 text-success-400', quote_rejected: 'bg-danger-500/20 text-danger-400',
      message: 'bg-cyan-500/20 text-cyan-400', system: 'bg-zinc-500/20 text-zinc-400',
    }
    return colors[type] || 'bg-zinc-500/20 text-zinc-400'
  }

  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications
  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 font-medium">Carregando notificações...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="page-header">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-danger-500/20 border border-danger-500/30">
                    <Bell className="w-5 h-5 text-danger-400" />
                  </div>
                  <span className="text-danger-400 text-sm font-medium">Central</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Notificações</h1>
                <p className="text-zinc-400">{unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia! 🎉'}</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="btn-primary flex items-center gap-2 py-2.5">
                    <CheckCheck className="w-4 h-4" /><span>Marcar todas</span>
                  </button>
                )}
                {notifications.filter(n => n.is_read).length > 0 && (
                  <button onClick={deleteAllRead} className="btn-secondary flex items-center gap-2 py-2.5">
                    <Trash2 className="w-4 h-4" /><span>Limpar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todas', count: notifications.length },
              { key: 'unread', label: 'Não lidas', count: unreadCount },
            ].map((btn) => (
              <button key={btn.key} onClick={() => setFilter(btn.key as any)} className={`filter-btn ${filter === btn.key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-6"><Bell className="w-12 h-12 text-primary-400" /></div>
                <p className="text-xl font-bold text-white mb-2">{filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}</p>
                <p className="text-zinc-500">{filter === 'unread' ? 'Você está em dia!' : 'Quando houver novidades, elas aparecerão aqui'}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div key={notification.id} onClick={() => handleNotificationClick(notification)}
                  className={`group list-item cursor-pointer ${!notification.is_read ? 'border-primary-500/30 bg-primary-500/5' : ''}`}>
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-semibold text-white text-sm">{notification.title}</h3>
                        {!notification.is_read && <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1 animate-pulse"></div>}
                      </div>
                      <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{notification.body}</p>
                      <p className="text-xs text-zinc-600">{new Date(notification.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }} className="action-btn action-btn-edit" title="Marcar como lida"><Check className="w-4 h-4" /></button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }} className="action-btn action-btn-delete" title="Excluir"><Trash2 className="w-4 h-4" /></button>
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
