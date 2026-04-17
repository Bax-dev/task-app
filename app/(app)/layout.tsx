import { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import ThemeColorApplier from '@/components/ThemeColorApplier';
import PreferencesSync from '@/components/PreferencesSync';
import SSEProvider from '@/components/SSEProvider';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreferencesSync />
      <ThemeColorApplier />
      <SSEProvider />
      <AppShell>{children}</AppShell>
    </>
  );
}
