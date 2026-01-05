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
  ClipboardList,
  FolderOpen
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
    { icon: FolderOpen, label: 'Documentos', path: '/documents', badge: null },
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
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <span className="text-white text-sm font-bold">
                      {userData?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
          // Versão expandida
          <div className="text-center">
            {/* Logo e Nome da Empresa */}
            <h1 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate">
              {clientData?.name || 'Portal do Cliente'}
            </h1>
            <p className="text-xs text-gray-500 mb-2 truncate">
              {clientData?.phone || 'Painel de Gestão'}
            </p>

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-3"></div>

            {/* Avatar e Info do Usuário */}
            <div
              className="flex flex-col items-center cursor-pointer group p-1 rounded-xl hover:bg-white/50 transition-all"
              onClick={() => router.push('/profile')}
            >
              <div className="relative mb-2 group-hover:scale-105 transition-transform">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.full_name || 'Avatar'}
                    className="w-16 h-16 rounded-full object-cover border-3 border-indigo-300 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl font-bold">
                      {userData?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {/* Badge de status online */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <p className="font-semibold text-gray-800 text-sm truncate max-w-[180px] group-hover:text-indigo-600 transition-colors">
                {userData?.full_name || 'Usuário'}
              </p>

              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                Editar Perfil
              </span>
            </div>
          </div>
        )}
        </div>

        {/* Busca Rápida (Placeholder visual) */}
        <div className={`px-3 pt-2 pb-1 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={onScanOpen}
            className={`group flex items-center gap-3 w-full p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/30 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm ${collapsed ? 'justify-center w-10 h-10 p-0' : ''}`}
            title="Abrir Scanner QR Code"
          >
            <Camera size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm font-medium">Scanner QR</span>
              </div>
            )}
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {!collapsed && (
            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">
              Menu Principal
            </p>
          )}

          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-white text-indigo-600 shadow-sm border border-indigo-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 hover:translate-x-1'
                  }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
                title={collapsed ? item.label : undefined}
              >
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                )}

                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`}
                />

                {!collapsed && (
                  <div className="flex-1 flex justify-between items-center">
                    <span className={`text-sm font-medium ${isActive ? 'text-indigo-900' : ''}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-pulse-subtle">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Badge for Collapsed State */}
                {collapsed && item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border border-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="text-sm font-medium">Sair do Sistema</span>}
          </button>
        </div>
      </>
      );

      return (
      <>
        {/* Mobile Menu Button - Left aligned like Admin */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slideIn">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Desktop Sidebar - Premium Layout */}
        <aside
          className={`
          hidden lg:flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out relative shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
          ${collapsed ? 'w-20' : 'w-72'}
        `}
        >
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <SidebarContent />
          </div>

          {/* Floating Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-10 -right-3.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 transition-all z-20 group scale-0 lg:scale-100"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight size={14} className="group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronLeft size={14} className="group-hover:scale-110 transition-transform" />
            )}
          </button>
        </aside>
      </>
      );
}
