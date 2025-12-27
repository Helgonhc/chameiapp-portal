'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, CalendarDays, Bell, User, LogOut, Menu, X, Building2, Ticket, MessageCircle, ChevronRight, Zap, Wrench } from 'lucide-react'
import { useState } from 'react'
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
    { icon: Home, label: 'Dashboard', path: '/dashboard', badge: null },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null },
    { icon: Wrench, label: 'Manutenções', path: '/maintenance', badge: null },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', badge: null },
    { icon: Calendar, label: 'Agendamentos', path: '/appointments', badge: null },
    { icon: Ticket, label: 'Meus Chamados', path: '/tickets', badge: null },
    { icon: MessageCircle, label: 'Chat Suporte', path: '/chat', badge: null },
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null },
    { icon: FileText, label: 'Relatórios', path: '/reports', badge: null },
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
    { icon: User, label: 'Meu Perfil', path: '/profile', badge: null },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/10"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-72 flex flex-col
          sidebar-gradient
          border-r border-white/5
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            {clientData?.client_logo_url || clientData?.logo_url ? (
              <div className="w-10 h-10 rounded-xl bg-white/5 p-1.5 flex items-center justify-center border border-white/10">
                <img
                  src={clientData.client_logo_url || clientData.logo_url}
                  alt={clientData.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate text-sm">
                {clientData?.name || 'Portal Cliente'}
              </h2>
              <p className="text-xs text-zinc-500 truncate">
                {clientData?.phone || 'Bem-vindo'}
              </p>
            </div>
          </div>

          {/* User Card */}
          <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/5 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.full_name || 'Avatar'}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">
                      {userData?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-[#1a1a2e] status-online"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {userData?.full_name || 'Usuário'}
                </p>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 mt-1 border border-primary-500/30">
                  <Zap className="w-3 h-3" />
                  Cliente
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 px-3">
            Menu Principal
          </p>
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
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-white border border-primary-500/30'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg transition-all duration-200
                      ${active
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300'
                      }
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge ? (
                      <span className="relative flex items-center justify-center">
                        <span className="absolute inset-0 bg-accent-500 rounded-full blur-sm animate-pulse"></span>
                        <span className="relative bg-gradient-to-r from-accent-500 to-accent-600 text-dark-900 text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      </span>
                    ) : active ? (
                      <ChevronRight className="w-4 h-4 text-primary-400" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:bg-danger-500/10 hover:text-danger-400 transition-all duration-200 group border border-transparent hover:border-danger-500/20"
          >
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-danger-500/20 transition-all duration-200">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Sair da Conta</span>
          </button>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600">
              Powered by <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">ChameiApp</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
