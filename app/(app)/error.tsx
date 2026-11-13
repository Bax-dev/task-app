'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="p-4 sm:p-6 max-w-md mx-auto mt-10 rounded-xl border border-border bg-card text-center space-y-3">
      <AlertTriangle className="w-6 h-6 mx-auto text-destructive" />
      <h1 className="text-base font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">This page failed to load. Try again, or come back later.</p>
      <Button size="sm" onClick={reset}>Try again</Button>
    </div>
  );
}
