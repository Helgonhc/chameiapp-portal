'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    { id: 1, title: 'Nova OS Criada', msg: 'Ordem #1234 foi aberta com sucesso.', type: 'success', time: '2 min atrás' },
    { id: 2, title: 'Manutenção Perto', msg: 'Equipamento X precisa de revisão.', type: 'warning', time: '1 hora atrás' },
    { id: 3, title: 'Bem-vindo!', msg: 'Configure seu perfil para começar.', type: 'info', time: '1 dia atrás' },
  ]; // Mock data

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pb-20 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Marcar todas como lidas</button>
        </div>

        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                {n.type === 'success' ? <Check size={20} /> : n.type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{n.title}</h3>
                <p className="text-slate-500 text-sm">{n.msg}</p>
                <p className="text-xs text-slate-400 mt-1">{n.time}</p>
              </div>
              {n.type === 'warning' && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full m-3" />}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Bell size={48} className="mx-auto mb-2 opacity-20" />
              <p>Tudo limpo por aqui.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
