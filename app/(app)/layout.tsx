import { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import ThemeColorApplier from '@/components/ThemeColorApplier';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeColorApplier />
      <AppShell>{children}</AppShell>
    </>
  );
}
