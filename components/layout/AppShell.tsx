'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import CommandPalette from '@/components/CommandPalette';
import AiAssistantPanel from '@/components/ai/AiAssistantPanel';
import SSEProvider from '@/components/SSEProvider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const COLLAPSED_KEY = 'taskflow:sidebar-collapsed';

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {}
  }, []);

  // Navbar advertises Ctrl/⌘+K for the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AiAssistantPanel open={aiPanelOpen} onOpenChange={setAiPanelOpen} />
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 gap-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onClose={() => setSidebarOpen(false)} collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onMenuToggle={() => setSidebarOpen(true)}
          onDesktopToggle={toggleCollapse}
          sidebarCollapsed={collapsed}
          onSearchClick={() => setCommandPaletteOpen(true)}
          onAiClick={() => setAiPanelOpen(true)}
        />
        <SSEProvider />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
