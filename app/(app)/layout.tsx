import { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import ThemeColorApplier from '@/components/ThemeColorApplier';
import PreferencesSync from '@/components/PreferencesSync';
import TimezoneSync from '@/components/TimezoneSync';
import SSEProvider from '@/components/SSEProvider';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreferencesSync />
      <TimezoneSync />
      <ThemeColorApplier />
      <SSEProvider />
      <AppShell>{children}</AppShell>
    </>
  );
}
