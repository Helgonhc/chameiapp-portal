'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import ScannerModal from './ScannerModal';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Building2, Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [clientData, setClientData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { unreadCount: unreadNotifications } = useRealtimeNotifications();

  useEffect(() => {
    checkAuth();
    loadPendingQuotes();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, client_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      if (profile.role !== 'client') {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }
      setUserData(profile);

      if (profile.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', profile.client_id)
          .single();

        if (client) setClientData(client);
      }
    }
  }

  async function loadPendingQuotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (!profile?.client_id) return;

      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .eq('status', 'pending');

      setPendingQuotes(count || 0);
    } catch (error) {
      // console.error('Error loading quotes:', error);
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100 transition-colors duration-300">
      <Sidebar
        clientData={clientData}
        userData={userData}
        unreadNotifications={unreadNotifications}
        pendingQuotes={pendingQuotes}
        onScanOpen={() => setIsScannerOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className="flex-1 overflow-auto relative h-screen">
        {/* Top Floating Actions (Notifications) */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-200">
            <NotificationBell />
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
          {children}
        </div>

        {/* Global Scanner Modal */}
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
        />
      </main>
    </div>
  );
}
