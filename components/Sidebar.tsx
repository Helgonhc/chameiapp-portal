'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Calendar,
  CalendarDays,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Ticket,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Wrench,
  Camera,
  Server,
  History,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  clientData?: any;
  userData?: any;
  unreadNotifications?: number;
  pendingQuotes?: number;
  onScanOpen?: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({
  clientData,
  userData,
  unreadNotifications = 0,
  pendingQuotes = 0,
  onScanOpen,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mapeamento de itens do menu
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', badge: null },
    { icon: Camera, label: 'Escanear QR', path: 'scanner', badge: null, action: true },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null },
    { icon: ClipboardList, label: 'Solicitações', path: '/quote-requests', badge: null },
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null },
    { icon: Server, label: 'Equipamentos', path: '/equipments', badge: null },
    { icon: Wrench, label: 'Manutenções', path: '/maintenance', badge: null },
    { icon: History, label: 'Histórico', path: '/history', badge: null },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', badge: null },
    { icon: Calendar, label: 'Agendamentos', path: '/appointments', badge: null },
    { icon: Ticket, label: 'Meus Chamados', path: '/tickets', badge: null },
    { icon: MessageCircle, label: 'Chat Suporte', path: '/chat', badge: null },
    { icon: FileText, label: 'Relatórios', path: '/reports', badge: null },
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
  ];

  /* Logout logic */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-indigo-100 z-40 transition-all duration-300 ease-in-out shadow-xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${collapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'}
          flex flex-col
        `}
      >
        {/* Header (Gradient) */}
        <div className={`${collapsed ? 'p-2' : 'p-6'} bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-indigo-100 transition-all duration-300`}>
          {collapsed ? (
            // Collapsed: Show Logo Icon or Avatar
            <div className="flex justify-center cursor-pointer" onClick={() => router.push('/profile')}>
              {clientData?.client_logo_url || clientData?.logo_url ? (
                <img
                  src={clientData.client_logo_url || clientData.logo_url}
                  alt="Logo"
                  className="w-10 h-10 object-contain hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold hover:bg-indigo-700 transition-colors">
                  {clientData?.name?.charAt(0) || 'C'}
                </div>
              )}
            </div>
          ) : (
            // Expanded: Full Info
            <div className="text-center animate-fadeIn">
              {/* Logo */}
              <div className="flex justify-center mb-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
                {clientData?.client_logo_url || clientData?.logo_url ? (
                  <img
                    src={clientData.client_logo_url || clientData.logo_url}
                    alt={clientData.name}
                    className="h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
                    <Building2 size={24} />
                  </div>
                )}
              </div>

              <h2 className="font-bold text-gray-800 leading-tight">
                {clientData?.name || 'Portal do Cliente'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {clientData?.phone || 'Painel de Gestão'}
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-4"></div>

              {/* User Avatar - CLICKABLE */}
              <div
                className="flex flex-col items-center cursor-pointer group p-2 rounded-xl hover:bg-indigo-50/50 transition-colors"
                onClick={() => router.push('/profile')}
              >
                <div className="relative mb-2 group-hover:scale-105 transition-transform">
                  {userData?.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt={userData.full_name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-md">
                      {userData?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{userData?.full_name}</p>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100 group-hover:bg-indigo-100">
                  Editar Perfil
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu Principal
            </p>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.action && onScanOpen && item.path === 'scanner') {
                    onScanOpen();
                  } else {
                    router.push(item.path);
                  }
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center group relative
                  ${collapsed ? 'justify-center px-0 py-3' : 'justify-start px-4 py-3'}
                  rounded-xl transition-all duration-200
                  ${active
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Strip */}
                {active && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-600 rounded-r-full"></div>
                )}

                <Icon
                  size={collapsed ? 24 : 20}
                  className={`
                    transition-all duration-200
                    ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}
                  `}
                />

                {!collapsed && (
                  <span className="ml-3 truncate">{item.label}</span>
                )}

                {/* Badges */}
                {item.badge && (
                  collapsed ? (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  ) : (
                    <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-indigo-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center 
              ${collapsed ? 'justify-center' : 'justify-start gap-3'}
              text-gray-500 hover:text-red-600 hover:bg-red-50 
              p-2 rounded-lg transition-all duration-200
            `}
            title="Sair"
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>

        {/* Collapse Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-indigo-100 rounded-full p-1 shadow-md text-indigo-600 hover:scale-110 transition-transform z-50"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
