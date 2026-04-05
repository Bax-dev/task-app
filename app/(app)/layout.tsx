import { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import ThemeColorApplier from '@/components/ThemeColorApplier';
import SSEProvider from '@/components/SSEProvider';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeColorApplier />
      <SSEProvider />
      <AppShell>{children}</AppShell>
    </>
  );
}
