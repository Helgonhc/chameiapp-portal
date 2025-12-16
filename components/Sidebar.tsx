'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, History, Bell, User, LogOut, Menu, X, Settings } from 'lucide-react'
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
    { icon: Home, label: 'Início', path: '/dashboard', badge: null },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-64 flex flex-col
        `}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {(clientData?.client_logo_url || clientData?.logo_url) ? (
              <img
                src={clientData.client_logo_url || clientData.logo_url}
                alt={clientData.name}
                className="h-10 w-10 object-contain rounded-lg bg-slate-50 p-1"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {clientData?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 truncate text-sm">
                {clientData?.name || 'Portal'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {clientData?.responsible_name || 'Cliente'}
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
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 relative group
                      ${active
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
