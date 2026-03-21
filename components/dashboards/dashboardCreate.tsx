'use client';

import { useState } from 'react';
import { Plus, Loader2, LayoutGrid, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateDashboardMutation } from '@/store/api';

interface DashboardCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export default function DashboardCreate({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: DashboardCreateProps) {
  const [dashboardName, setDashboardName] = useState('');
  const [createDashboard, { isLoading: isCreatingDashboard }] = useCreateDashboardMutation();

  const handleCreateDashboard = async () => {
    try {
      await createDashboard({ name: dashboardName, organizationId }).unwrap();
      toast.success('Dashboard created');
      onOpenChange(false);
      setDashboardName('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateDashboard(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Dashboard</span>
            </div>
          </div>
          <input
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="Dashboard Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground">
              <LayoutGrid className="w-3.5 h-3.5" />
              Default Layout
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button type="submit" disabled={isCreatingDashboard || !dashboardName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreatingDashboard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreatingDashboard ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
