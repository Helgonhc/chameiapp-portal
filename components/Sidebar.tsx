'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, DollarSign, Calendar, History, Bell, User, LogOut, Menu, X, Sparkles } from 'lucide-react'
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
    { icon: Home, label: 'Início', path: '/dashboard', badge: null, color: 'from-blue-500 to-cyan-500' },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null, color: 'from-purple-500 to-pink-500' },
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null, color: 'from-amber-500 to-orange-500' },
    { icon: Calendar, label: 'Agendamentos', path: '/appointments', badge: null, color: 'from-emerald-500 to-teal-500' },
    { icon: History, label: 'Histórico', path: '/history', badge: null, color: 'from-indigo-500 to-purple-500' },
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null, color: 'from-red-500 to-pink-500' },
    { icon: User, label: 'Meu Perfil', path: '/profile', badge: null, color: 'from-slate-500 to-slate-600' },
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
      {/* Mobile Menu Button - Premium */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Premium */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          w-72 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700/50
        `}
      >
        {/* Efeito de brilho no topo */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        
        {/* Logo/Header Premium */}
        <div className="p-6 border-b border-slate-700/50 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="relative flex items-center gap-4">
            {(clientData?.client_logo_url || clientData?.logo_url) ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur opacity-50"></div>
                <img
                  src={clientData.client_logo_url || clientData.logo_url}
                  alt={clientData.name}
                  className="relative h-12 w-12 object-contain rounded-xl bg-white/10 backdrop-blur-xl p-2 border border-white/20"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur opacity-50"></div>
                <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
                  <span className="text-white font-bold text-xl">
                    {clientData?.name?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate text-base flex items-center gap-2">
                {clientData?.name || 'Portal'}
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {clientData?.responsible_name || 'Cliente Premium'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items Premium */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.path} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                  <button
                    onClick={() => {
                      router.push(item.path)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
                      transition-all duration-300 relative group overflow-hidden
                      ${active
                        ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {/* Efeito de brilho no hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    {/* Ícone com efeito */}
                    <div className={`relative ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    
                    {item.badge && (
                      <span className="relative">
                        <span className="absolute inset-0 bg-red-500 rounded-full blur animate-pulse"></span>
                        <span className="relative bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </span>
                    )}
                    
                    {active && (
                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full shadow-lg shadow-white/50" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          <div className="w-2 h-2 bg-white rounded-full absolute top-0"></div>
                        </div>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer Premium */}
        <div className="p-4 border-t border-slate-700/50 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <button
            onClick={handleLogout}
            className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-sm font-medium">Sair da Conta</span>
          </button>
        </div>

        {/* Efeito de brilho no fundo */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
      </aside>
    </>
  )
}
