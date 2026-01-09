'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import ScannerModal from './ScannerModal';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import WelcomeWizard from './WelcomeWizard';
import { useAuthStore } from '../store/authStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuthStore();
  const [clientData, setClientData] = useState<any>(null);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { unreadCount: unreadNotifications } = useRealtimeNotifications();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Only proceed if authenticated
    if (isAuthenticated && profile?.client_id) {
      loadClientData();
      loadPendingQuotes();
    }

    // Check if new user
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      // Small delay for smooth entrance
      setTimeout(() => setShowWizard(true), 1000);
    }
  }, [isAuthenticated, profile]);

  async function loadClientData() {
    if (!profile?.client_id) return;

    try {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profile.client_id)
        .single();

      if (client) {
        setClientData(client);
        // Apply Theme
        if (client.primary_color) {
          document.documentElement.style.setProperty('--primary-color', client.primary_color);

          // Set RGB for opacity utilities
          const hex = client.primary_color.replace('#', '');
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPendingQuotes() {
    if (!profile?.client_id) return;

    try {
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
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar
        clientData={clientData}
        userData={profile}
        unreadNotifications={unreadNotifications}
        pendingQuotes={pendingQuotes}
        onScanOpen={() => setIsScannerOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onOpenTour={() => setShowWizard(true)}
      />

      <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
        {/* Top Header Mobile / Tablet Actions */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
          {/* Notification Bell with improved styling */}
          <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:shadow-md transition-all cursor-pointer">
            <NotificationBell />
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto w-full p-4 lg:p-8 pt-20 lg:pt-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>

        {/* Global Scanner Modal */}
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
        />

        {/* Onboarding Wizard */}
        <WelcomeWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onCheck={() => { }}
        />
      </main>
    </div>
  );
}
