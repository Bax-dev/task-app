'use client';

import { useState, useEffect } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateDashboardMutation } from '@/store/api';

interface DashboardEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: { id: string; name: string };
}

export default function DashboardEdit({
  open,
  onOpenChange,
  dashboard,
}: DashboardEditProps) {
  const [name, setName] = useState(dashboard.name);
  const [updateDashboard, { isLoading: isUpdating }] = useUpdateDashboardMutation();

  useEffect(() => {
    if (open) {
      setName(dashboard.name);
    }
  }, [open, dashboard.name]);

  const handleUpdate = async () => {
    try {
      await updateDashboard({ id: dashboard.id, name }).unwrap();
      toast.success('Dashboard updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Edit Dashboard</span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dashboard Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim() || name === dashboard.name} size="sm" className="gap-1.5 px-5">
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
