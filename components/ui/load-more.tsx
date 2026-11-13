'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** "Load more" for RTK infinite queries; renders nothing once the last page is loaded. */
export function LoadMore({ hasMore, loading, onLoadMore }: { hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-4">
      <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading} aria-busy={loading} className="gap-2">
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {loading ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}
