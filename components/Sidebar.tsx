'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
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
  Ticket,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Camera,
  Server,
  History,
  ClipboardList,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  clientData?: any;
  userData?: any;
  unreadNotifications?: number;
  pendingQuotes?: number;
  onScanOpen?: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onOpenTour?: () => void;
}

export default function Sidebar({
  clientData,
  userData,
  unreadNotifications = 0,
  pendingQuotes = 0,
  onScanOpen,
  collapsed,
  setCollapsed,
  onOpenTour
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mapeamento de itens do menu
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', badge: null, permission: 'view_dashboard' },
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', badge: null, permission: 'view_calendar' },
    { icon: Ticket, label: 'Chamados', path: '/tickets', badge: null, permission: 'view_tickets' },
    { icon: MessageCircle, label: 'Chat', path: '/chat', badge: null, permission: 'view_chat' },
    { icon: FolderOpen, label: 'Documentos', path: '/documents', badge: null, permission: 'view_documents' },
    { icon: Server, label: 'Equipamentos', path: '/equipments', badge: null, permission: 'view_equipments' },
    { icon: Camera, label: 'Escanear QR', path: 'scanner', badge: null, action: true, permission: 'view_equipments' },
    { icon: History, label: 'Histórico', path: '/history', badge: null, permission: 'view_history' },
    { icon: Wrench, label: 'Manutenções', path: '/maintenance', badge: null, permission: 'view_calendar' }, // Linked to calendar/maintenance
    { icon: Bell, label: 'Notificações', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : null, permission: 'view_dashboard' }, // Always visible if dashboard is
    { icon: DollarSign, label: 'Orçamentos', path: '/quotes', badge: pendingQuotes > 0 ? pendingQuotes : null, permission: 'view_quotes' },
    { icon: FileText, label: 'Ordens de Serviço', path: '/service-orders', badge: null, permission: 'view_service_orders' },
    { icon: ClipboardList, label: 'Solicitações', path: '/quote-requests', badge: null, permission: 'view_quotes' },
    { icon: Sparkles, label: 'Tour Interativo', path: 'tour', badge: null, action: true },
  ];

  const { logout } = useAuthStore();

  /* Logout logic */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Header Branding */}
      <div className={`flex flex-col items-center justify-center p-6 border-b border-slate-100 transition-all duration-300 ${collapsed ? 'px-2' : ''}`}>
        <div
          onClick={() => router.push('/dashboard')}
          className={`relative cursor-pointer transition-transform hover:scale-105 duration-300 ${collapsed ? 'w-10 h-10' : 'w-16 h-16'}`}
        >
          {clientData?.client_logo_url || clientData?.logo_url ? (
            <img
              src={clientData.client_logo_url || clientData.logo_url}
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          ) : (
            <div className={`w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg ${collapsed ? 'text-sm' : 'text-2xl'}`}>
              {clientData?.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 text-center animate-fadeIn">
            <h1 className="font-bold text-slate-800 text-sm leading-tight truncate px-2">
              {clientData?.name || 'Portal do Cliente'}
            </h1>
            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider rounded-md">
              Área do Cliente
            </span>
          </div>
        )}
      </div>

      {/* User Profile (Moved to Top) */}
      <div className={`mx-3 mb-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 ${collapsed ? 'mx-1 p-1 flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div
              className="relative cursor-pointer group"
              onClick={() => router.push('/profile')}
            >
              {userData?.avatar_url ? (
                <img
                  src={`${userData.avatar_url}?t=${Date.now()}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-indigo-200 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center shadow-sm text-indigo-600 font-bold border-2 border-white">
                  {userData?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => router.push('/profile')}>
                {userData?.full_name?.split(' ')[0] || 'Usuário'}
              </p>
              <button
                onClick={handleLogout}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors mt-0.5"
              >
                <LogOut size={10} />
                SAIR
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div onClick={() => router.push('/profile')} className="cursor-pointer relative">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                {userData?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
        {menuItems.map((item) => {
          // Permission Check - Clients see everything for now to avoid hidden items
          const isClient = userData?.role?.toLowerCase() === 'client';
          if (!isClient && item.permission) {
            const userPerms = userData?.permissions || {};
            if (!userPerms[item.permission]) return null;
          }

          // Handle 'action' items like Scanner AND Tour
          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.path === 'scanner' && onScanOpen) onScanOpen();
                  if (item.path === 'tour' && onOpenTour) onOpenTour();
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${item.path === 'tour' ? 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <div className={`p-1.5 rounded-lg transition-colors group-hover:bg-white group-hover:text-indigo-600 ${item.path === 'tour' ? 'text-indigo-600' : 'text-slate-400'}`}>
                  <item.icon size={20} />
                </div>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          }

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
                  ? 'bg-indigo-50/80 text-indigo-700 shadow-sm ring-1 ring-indigo-100' // Active state
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' // Inactive state
                }
                ${collapsed ? 'justify-center px-2' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <div className={`
                p-1.5 rounded-lg transition-colors
                ${isActive ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 group-hover:text-slate-600'}
              `}>
                <Icon size={20} />
              </div>

              {!collapsed && (
                <div className="flex-1 flex justify-between items-center overflow-hidden">
                  <span className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : ''}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full shadow-sm ml-2">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {collapsed && item.badge && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Branding/Version */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">v2.5.0 Elite</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2.5 bg-white text-slate-600 rounded-xl shadow-md border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slideIn">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col bg-white border-r border-slate-200/60
          transition-all duration-300 ease-in-out relative z-30
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        <SidebarContent />

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-8 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:text-indigo-600 text-slate-400 transition-all z-40 group"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
