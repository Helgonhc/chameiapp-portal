'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Paperclip, User, Loader2, FileImage } from 'lucide-react'

interface Message {
    id: string
    message: string
    attachments: string[] | null
    created_at: string
    sender_id: string
    sender?: {
        full_name: string
        role: string
    }
}

interface TicketChatProps {
    ticketId: string
    currentUserEmail?: string
}

export default function TicketChat({ ticketId, currentUserEmail }: TicketChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getCurrentUser()
        loadMessages()
        subscribeToMessages()

        return () => {
            supabase.channel(`ticket_chat_${ticketId}`).unsubscribe()
        }
    }, [ticketId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    async function getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)
    }

    async function loadMessages() {
        try {
            const { data, error } = await supabase
                .from('ticket_messages')
                .select('*, sender:sender_id(full_name, role)')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error)
        } finally {
            setLoading(false)
        }
    }

    function subscribeToMessages() {
        supabase
            .channel(`ticket_chat_${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                },
                async (payload) => {
                    // Fetch the new message with sender info
                    const { data, error } = await supabase
                        .from('ticket_messages')
                        .select('*, sender:sender_id(full_name, role)')
                        .eq('id', payload.new.id)
                        .single()

                    if (!error && data) {
                        setMessages(prev => [...prev, data])
                    }
                }
            )
            .subscribe()
    }

    async function handleSendMessage() {
        if ((!newMessage.trim() && !uploading) || sending) return

        try {
            setSending(true)
            const { error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    message: newMessage.trim(),
                    sender_id: currentUserId,
                    is_internal: false
                })

            if (error) throw error
            setNewMessage('')
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
            alert('Erro ao enviar mensagem. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const uploadedUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `ticket-chat/${ticketId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('os-photos')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('os-photos')
                    .getPublicUrl(filePath)

                uploadedUrls.push(publicUrl)
            }

            // Automatically send a message with the attachments
            const { error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    message: '📎 Anexo(s) enviado(s)',
                    attachments: uploadedUrls,
                    sender_id: currentUserId,
                    is_internal: false
                })

            if (error) throw error

        } catch (error) {
            console.error('Erro ao fazer upload:', error)
            alert('Erro ao enviar anexo(s).')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    Chat do Chamado
                </h3>
                <span className="text-xs text-gray-500">
                    Suporte e acompanhamento
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-sm">Envie uma mensagem para iniciar o atendimento.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        const isAdmin = msg.sender?.role === 'admin' || msg.sender?.role === 'technician'

                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : isAdmin
                                                ? 'bg-white border border-orange-200 rounded-bl-none'
                                                : 'bg-white border border-gray-200 rounded-bl-none'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <span className={`text-xs font-semibold ${isMe ? 'text-blue-100' : 'text-gray-600'}`}>
                                            {isMe ? 'Você' : (msg.sender?.full_name || 'Usuário')}
                                            {isAdmin && !isMe && <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px]">SUPORTE</span>}
                                        </span>
                                        <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.message}
                                    </p>

                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {msg.attachments.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                        <img src={url} alt="Anexo" className="w-full h-32 object-cover rounded-md" />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <FileImage className="w-5 h-5" />
                                                            <span className="text-xs underline truncate max-w-[150px]">Ver anexo</span>
                                                        </div>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploading}
                        className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Anexar arquivo"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        accept="image/*,.pdf"
                    />

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Digite sua mensagem..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none max-h-32 min-h-[50px]"
                            rows={1}
                            disabled={sending || uploading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={(!newMessage.trim() && !uploading) || sending}
                            className="absolute right-2 bottom-1.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            {sending || uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
                {uploading && (
                    <p className="text-xs text-blue-500 mt-2 ml-12 animate-pulse">Enviando arquivos...</p>
                )}
            </div>
        </div>
    )
}
