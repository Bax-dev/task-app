'use client';

import { useState } from 'react';
import {
  Globe, Lock, Building2, Loader2, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateSavedFilterMutation } from '@/store/api';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  DONE: '#22c55e',
  REJECTED: '#ef4444',
  CANCELLED: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const DUE_DATE_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'no_date', label: 'No Date' },
] as const;

interface SavedFilterCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  currentQuery?: { status: string[]; priority: string[]; dueDate: string };
}

export default function SavedFilterCreate({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  currentQuery,
}: SavedFilterCreateProps) {
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveFilterShared, setSaveFilterShared] = useState(false);
  const [createSavedFilter, { isLoading: isCreatingFilter }] = useCreateSavedFilterMutation();

  const filterStatus = currentQuery?.status || [];
  const filterPriority = currentQuery?.priority || [];
  const filterDueDate = currentQuery?.dueDate || '';

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) return;
    try {
      const query = {
        ...(filterStatus.length > 0 ? { status: filterStatus } : {}),
        ...(filterPriority.length > 0 ? { priority: filterPriority } : {}),
        ...(filterDueDate ? { dueDate: filterDueDate } : {}),
      };
      await createSavedFilter({
        name: saveFilterName,
        query,
        shared: saveFilterShared,
        organizationId,
      }).unwrap();
      toast.success('Filter saved');
      onOpenChange(false);
      setSaveFilterName('');
      setSaveFilterShared(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to save filter');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveFilter(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Save Filter</span>
            </div>
          </div>
          <input
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
            placeholder="Filter Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          {/* Show active criteria summary */}
          <div className="px-5 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Current Filter Criteria:</p>
            <div className="flex flex-wrap gap-1.5">
              {filterStatus.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[s]}18`, color: STATUS_COLORS[s] }}>
                  {STATUS_LABELS[s]}
                </span>
              ))}
              {filterPriority.map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PRIORITY_COLORS[p]}18`, color: PRIORITY_COLORS[p] }}>
                  {PRIORITY_LABELS[p]}
                </span>
              ))}
              {filterDueDate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {DUE_DATE_OPTIONS.find((d) => d.value === filterDueDate)?.label}
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSaveFilterShared(!saveFilterShared)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${saveFilterShared ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}
            >
              {saveFilterShared ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {saveFilterShared ? 'Shared' : 'Private'}
            </button>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button type="submit" disabled={isCreatingFilter || !saveFilterName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreatingFilter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isCreatingFilter ? 'Saving...' : 'Save Filter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
