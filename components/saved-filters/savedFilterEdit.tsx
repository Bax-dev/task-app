'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Lock, Loader2, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateSavedFilterMutation } from '@/store/api';

interface SavedFilterEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: { id: string; name: string; shared: boolean; query: any };
}

export default function SavedFilterEdit({
  open,
  onOpenChange,
  filter,
}: SavedFilterEditProps) {
  const [name, setName] = useState(filter.name);
  const [shared, setShared] = useState(filter.shared);
  const [updateSavedFilter, { isLoading: isUpdatingFilter }] = useUpdateSavedFilterMutation();

  useEffect(() => {
    if (open) {
      setName(filter.name);
      setShared(filter.shared);
    }
  }, [open, filter]);

  const handleUpdateFilter = async () => {
    if (!name.trim()) return;
    try {
      await updateSavedFilter({
        id: filter.id,
        name,
        shared,
        query: filter.query,
      }).unwrap();
      toast.success('Filter updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update filter');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateFilter(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Edit Filter</span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Filter Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShared(!shared)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${shared ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}
            >
              {shared ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {shared ? 'Shared' : 'Private'}
            </button>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end">
            <Button type="submit" disabled={isUpdatingFilter || !name.trim()} size="sm" className="gap-1.5 px-5">
              {isUpdatingFilter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isUpdatingFilter ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
