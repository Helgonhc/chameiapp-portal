'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, History, Bell, User, LogOut, Menu, X, Building2, Ticket } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SidebarProps {
  clientData?: any
  unreadNotifications?: number
  pendingQuotes?: number
}

export default function Sidebar({ clientData, unreadNotifications = 0, pendingQuotes = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', badge: null },
    { icon: Ticket, label: 'Chamados', path: '/tickets', badge: null },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null },
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null },
    { icon: Calendar, label: 'Agendamentos', path: '/appointments', badge: null },
    { icon: History, label: 'Histórico', path: '/history', badge: null },
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
        {/* Header com Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            {clientData?.logo_url ? (
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur"></div>
                <img
                  src={clientData.logo_url}
                  alt={clientData.name}
                  className="relative h-12 w-12 object-contain rounded-xl bg-white/10 p-2"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur"></div>
                <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate text-base">
                {clientData?.name || 'Portal Cliente'}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {clientData?.responsible_name || 'Bem-vindo'}
              </p>
            </div>
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
