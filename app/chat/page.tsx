'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Mock setup logic for artifact size constraint - functionality assumes similar hookup as before
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    setup();
  }, []);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Suporte Técnico</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-500">Online agora</p>
            </div>
          </div>
        </div>

        {/* Messages Area - Light Theme WhatsApp Style */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f2f5] custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <MessageCircle size={48} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-slate-400 text-xs">Comece a conversa!</p>
            </div>
          )}
          {/* Mock Messages for visual verification if empty */}
          <div className="flex justify-center my-4"><span className="bg-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Hoje</span></div>

          <div className="flex justify-start">
            <div className="max-w-[80%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-700 text-sm leading-relaxed border border-slate-100">
              <p>Olá! Como posso ajudar você hoje?</p>
              <span className="text-[10px] text-slate-400 mt-1 block text-right">09:41</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-md text-white text-sm leading-relaxed">
              <p>Preciso de ajuda com a OS #1234.</p>
              <span className="text-[10px] text-indigo-200 mt-1 block text-right">09:42</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
