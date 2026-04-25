'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[app/error] route segment crashed', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-3">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        An unexpected error occurred while rendering this page. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
          Go home
        </Button>
      </div>
    </div>
  );
}
