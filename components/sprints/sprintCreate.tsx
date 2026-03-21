'use client';

import { useState } from 'react';
import { Plus, Loader2, CalendarDays, Target, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateSprintMutation } from '@/store/api';

interface SprintCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export default function SprintCreate({ open, onOpenChange, organizationId, organizationName }: SprintCreateProps) {
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [createSprint, { isLoading: isCreating }] = useCreateSprintMutation();

  const handleCreateSprint = async () => {
    try {
      await createSprint({
        name: sprintName,
        goal: sprintGoal || undefined,
        startDate: startDate || null,
        endDate: endDate || null,
        organizationId,
      }).unwrap();
      toast.success('Sprint created');
      onOpenChange(false);
      setSprintName('');
      setSprintGoal('');
      setStartDate('');
      setEndDate('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create sprint');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateSprint(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Sprint</span>
            </div>
          </div>
          <input
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            placeholder="Sprint Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={sprintGoal}
            onChange={(e) => setSprintGoal(e.target.value)}
            placeholder="Add a sprint goal..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${startDate ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs focus:outline-none w-[100px] cursor-pointer"
                placeholder="Start Date"
              />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${endDate ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs focus:outline-none w-[100px] cursor-pointer"
                placeholder="End Date"
              />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${sprintGoal ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
              <Target className="w-3.5 h-3.5" />
              Goal
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button type="submit" disabled={isCreating || !sprintName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreating ? 'Creating...' : 'Create Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
