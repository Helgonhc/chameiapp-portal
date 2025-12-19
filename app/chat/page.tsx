'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Send, User, Clock, Sparkles, Headphones } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: { full_name: string; role: string }
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

  useEffect(() => { checkAuth(); loadMessages(); subscribeToMessages() }, [])
  useEffect(() => { scrollToBottom() }, [messages])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
    else setCurrentUserId(user.id)
  }

  async function loadMessages() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data: channel } = await supabase.from('chat_channels').select('id').eq('type', 'general').eq('client_id', profile.client_id).single()
      if (!channel) {
        const { data: newChannel } = await supabase.from('chat_channels').insert({ name: 'Suporte', type: 'general', client_id: profile.client_id, is_active: true }).select().single()
        if (newChannel) { setChannelId(newChannel.id); loadChannelMessages(newChannel.id) }
      } else { setChannelId(channel.id); loadChannelMessages(channel.id) }
    } catch (error) { console.error('Erro:', error) }
    finally { setLoading(false) }
  }

  async function loadChannelMessages(channelId: string) {
    const { data } = await supabase.from('chat_messages').select(`*, sender:profiles!chat_messages_sender_id_fkey(full_name, role)`).eq('channel_id', channelId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  function subscribeToMessages() {
    const subscription = supabase.channel('chat_messages_changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
      const { data } = await supabase.from('chat_messages').select(`*, sender:profiles!chat_messages_sender_id_fkey(full_name, role)`).eq('id', payload.new.id).single()
      if (data) setMessages(prev => [...prev, data])
    }).subscribe()
    return () => { subscription.unsubscribe() }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending || !channelId) return
    const messageToSend = newMessage.trim()
    setNewMessage(''); setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      await supabase.from('chat_messages').insert({ channel_id: channelId, sender_id: user.id, content: messageToSend })
    } catch (error) { setNewMessage(messageToSend); alert('Erro ao enviar') }
    finally { setSending(false) }
  }

  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando chat...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="page-header py-6">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">Chat com Suporte <Sparkles className="w-5 h-5 text-accent-400" /></h1>
                <p className="text-zinc-400 flex items-center gap-2"><Headphones className="w-4 h-4" /> Tire suas dúvidas em tempo real</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          <div className="card h-[calc(100vh-280px)] flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-primary-500/50" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-zinc-500">Envie uma mensagem para começar</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId
                  const isSupport = ['super_admin', 'admin', 'technician'].includes(message.sender?.role)
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isSupport ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-zinc-600'}`}>
                                {message.sender?.full_name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-medium text-zinc-300">
                                {message.sender?.full_name || 'Usuário'}
                                {isSupport && <span className="ml-1 text-xs text-primary-400">• Suporte</span>}
                              </span>
                            </div>
                          )}
                          {isOwnMessage && <span className="text-sm font-medium text-zinc-300">Você</span>}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${isOwnMessage ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' : isSupport ? 'bg-primary-500/10 text-white border border-primary-500/20' : 'bg-surface-light text-white border border-white/5'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-4 bg-surface-light/50">
              <div className="flex gap-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Digite sua mensagem..." className="form-input flex-1" disabled={sending} />
                <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="btn-primary px-6 flex items-center gap-2">
                  {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /><span className="hidden sm:inline">Enviar</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
