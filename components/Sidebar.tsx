'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, History, Bell, User, LogOut, Menu, X } from 'lucide-react'
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-64 flex flex-col
          bg-white border-r border-gray-200
        `}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {clientData?.logo_url ? (
              <img
                src={clientData.logo_url}
                alt={clientData.name}
                className="h-10 w-10 object-contain rounded"
              />
            ) : (
              <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {clientData?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 truncate">
                {clientData?.name || 'Portal'}
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {clientData?.responsible_name || 'Cliente'}
              </p>
            </div>
          </div>
        </div>

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
                      transition-colors
                      ${active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
