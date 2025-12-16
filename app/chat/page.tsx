'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Send, User, Clock } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: {
    full_name: string
    role: string
  }
}

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [channelId, setChannelId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
    loadMessages()
    subscribeToMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setCurrentUserId(user.id)
    }
  }

  async function loadMessages() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      // Buscar canal geral do cliente
      const { data: channel } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('type', 'general')
        .eq('client_id', profile.client_id)
        .single()

      if (!channel) {
        // Criar canal se não existir
        const { data: newChannel } = await supabase
          .from('chat_channels')
          .insert({
            name: 'Suporte',
            type: 'general',
            client_id: profile.client_id,
            is_active: true
          })
          .select()
          .single()

        if (newChannel) {
          setChannelId(newChannel.id)
          loadChannelMessages(newChannel.id)
        }
      } else {
        setChannelId(channel.id)
        loadChannelMessages(channel.id)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadChannelMessages(channelId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(full_name, role)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao carregar mensagens:', error)
    } else {
      setMessages(data || [])
    }
  }

  function subscribeToMessages() {
    const subscription = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          // Buscar dados completos da nova mensagem
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles!chat_messages_sender_id_fkey(full_name, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending || !channelId) return

    const messageToSend = newMessage.trim()
    setNewMessage('') // Limpar imediatamente para melhor UX
    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('chat_messages').insert({
        channel_id: channelId,
        sender_id: user.id,
        content: messageToSend,
      })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setNewMessage(messageToSend) // Restaurar mensagem em caso de erro
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando chat...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Chat com Suporte</h1>
              <p className="text-blue-100 text-xs sm:text-sm">Tire suas dúvidas em tempo real</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg h-[calc(100vh-250px)] sm:h-[calc(100vh-300px)] flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-30" />
                  <p className="text-base sm:text-lg font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-xs sm:text-sm">Envie uma mensagem para começar</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId
                  const isSupport = message.sender?.role === 'admin' || message.sender?.role === 'technician'

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          {!isOwnMessage && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 ${
                                isSupport ? 'bg-blue-600' : 'bg-gray-400'
                              }`}>
                                {message.sender?.full_name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                {message.sender?.full_name || 'Usuário'}
                                {isSupport && <span className="ml-1 text-[10px] sm:text-xs text-blue-600">• Suporte</span>}
                              </span>
                            </div>
                          )}
                          {isOwnMessage && (
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Você</span>
                          )}
                        </div>
                        <div
                          className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : isSupport
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-900 border border-blue-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-400">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>
                            {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline text-sm sm:text-base">Enviar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
