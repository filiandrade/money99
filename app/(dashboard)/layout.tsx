'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import type { Profile } from '@/lib/types';

// Layout client-side do dashboard — controla sidebar mobile
// O profile é passado via prop do Server Component pai
interface DashboardLayoutClientProps {
  children: React.ReactNode;
  profile: Profile | null;
}

function DashboardLayoutClient({ children, profile }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Wrapper Server Component para buscar o profile
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return <DashboardLayoutClient profile={profile}>{children}</DashboardLayoutClient>;
}
