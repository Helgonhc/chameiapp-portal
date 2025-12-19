import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  message: string
  data: any
  is_read: boolean
  created_at: string
  order_id?: string
  quote_id?: string
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const channelRef = useRef<any>(null)

  // Carregar user ID
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }, [userId])

  // Carregar notificações quando userId mudar
  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [userId, loadNotifications])

  // Inscrever para realtime
  useEffect(() => {
    if (!userId) return

    // Remover canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `notifications-client-${userId}-${Date.now()}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Nova notificação recebida:', payload)
          const newNotification = payload.new as Notification
          setLatestNotification(newNotification)
          setNotifications(prev => [newNotification, ...prev].slice(0, 20))
          setUnreadCount(prev => prev + 1)
          
          // Mostrar toast notification
          showToast(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Notificação atualizada:', payload)
          const updatedNotification = payload.new as Notification
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
          // Recalcular unread
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length)
            return prev
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal de notificações:', status)
      })

    channelRef.current = channel

    // Pedir permissão para notificações do navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])

  function showToast(notification: Notification) {
    const notificationBody = notification.body || notification.message || ''
    
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notificationBody,
        icon: '/icon.png',
        badge: '/badge.png'
      })
    }

    // Toast visual na página
    const toast = document.createElement('div')
    toast.className = 'fixed top-20 right-4 z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-sm'
    toast.style.animation = 'slideIn 0.3s ease-out'
    toast.innerHTML = `
      <div class="flex gap-3">
        <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-900 text-sm mb-1">${notification.title}</p>
          <p class="text-sm text-slate-600 line-clamp-2">${notificationBody}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-slate-400 hover:text-slate-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `
    
    // Adicionar estilo de animação se não existir
    if (!document.getElementById('toast-animation-style')) {
      const style = document.createElement('style')
      style.id = 'toast-animation-style'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(toast)

    // Remover após 6 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => toast.remove(), 300)
    }, 6000)
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

  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return {
    notifications,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    refresh: loadNotifications
  }
}
