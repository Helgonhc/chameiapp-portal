'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, CalendarDays, History, Bell, User, LogOut, Menu, X, Building2, Ticket, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SidebarProps {
  clientData?: any
  userData?: any
  unreadNotifications?: number
  pendingQuotes?: number
}

export default function Sidebar({ clientData, userData, unreadNotifications = 0, pendingQuotes = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', badge: null, tooltip: 'Visão geral do portal' },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null, tooltip: 'Acompanhe os serviços em execução' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', badge: null, tooltip: 'Visualize ordens por data' },
    { icon: Calendar, label: 'Agendamentos', path: '/appointments', badge: null, tooltip: 'Agende visitas técnicas' },
    { icon: Ticket, label: 'Meus Chamados', path: '/tickets', badge: null, tooltip: 'Abra chamados quando precisar de ajuda' },
    { icon: MessageCircle, label: 'Chat Suporte', path: '/chat', badge: null, tooltip: 'Converse em tempo real com o suporte' },
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null, tooltip: 'Aprove orçamentos e acompanhe solicitações' },
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null, tooltip: 'Veja suas notificações' },
    { icon: User, label: 'Meu Perfil', path: '/profile', badge: null, tooltip: 'Gerencie seu perfil e usuários' },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(path: string) {
    return pathname === path
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-72 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          shadow-2xl
        `}
      >
        {/* Header com Logo da Empresa + Usuário Logado */}
        <div className="p-4 border-b border-slate-700/50">
          {/* Logo da Empresa (pequena) */}
          <div className="flex items-center gap-3 mb-3">
            {clientData?.client_logo_url || clientData?.logo_url ? (
              <img
                src={clientData.client_logo_url || clientData.logo_url}
                alt={clientData.name}
                className="h-8 object-contain"
              />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white truncate text-sm">
                {clientData?.name || 'Portal Cliente'}
              </h2>
              {clientData?.phone && (
                <p className="text-xs text-slate-400">📞 {clientData.phone}</p>
              )}
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent my-3"></div>

          {/* Avatar e Info do Usuário Logado */}
          <div className="flex flex-col items-center">
            {/* Avatar Grande */}
            <div className="relative mb-2">
              {userData?.avatar_url ? (
                <img 
                  src={userData.avatar_url} 
                  alt={userData.full_name || 'Avatar'} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">
                    {userData?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {/* Badge de status online */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            
            {/* Nome do Usuário */}
            <p className="font-semibold text-white text-sm truncate max-w-[180px] text-center">
              {userData?.full_name || 'Usuário'}
            </p>
            
            {/* Badge Cliente */}
            <span className="text-xs px-2 py-0.5 rounded-full mt-1 bg-blue-500/20 text-blue-300">
              👤 Cliente
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      router.push(item.path)
                      setIsOpen(false)
                    }}
                    title={item.tooltip}
                    className={`
                      group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}
                    <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="relative">
                        <span className="absolute inset-0 bg-red-500 rounded-full blur animate-pulse"></span>
                        <span className="relative bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer com Logout */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  )
}
