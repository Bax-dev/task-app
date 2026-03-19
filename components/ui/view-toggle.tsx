'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from './button';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
        onClick={() => onViewChange('grid')}
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 rounded-none ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
        onClick={() => onViewChange('list')}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
}
