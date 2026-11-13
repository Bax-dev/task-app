import { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import ThemeColorApplier from '@/components/ThemeColorApplier';
import PreferencesSync from '@/components/PreferencesSync';
import TimezoneSync from '@/components/TimezoneSync';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreferencesSync />
      <TimezoneSync />
      <ThemeColorApplier />
      <AppShell>{children}</AppShell>
    </>
  );
}
