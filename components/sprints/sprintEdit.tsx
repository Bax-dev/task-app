'use client';

import { useState, useEffect } from 'react';
import { Loader2, CalendarDays, Target, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateSprintMutation } from '@/store/api';

interface SprintEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: { id: string; name: string; goal: string | null; startDate: string | null; endDate: string | null; status: string };
}

export default function SprintEdit({ open, onOpenChange, sprint }: SprintEditProps) {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal || '');
  const [startDate, setStartDate] = useState(sprint.startDate ? sprint.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(sprint.endDate ? sprint.endDate.slice(0, 10) : '');
  const [status, setStatus] = useState(sprint.status);

  const [updateSprint, { isLoading: isUpdating }] = useUpdateSprintMutation();

  // Re-sync state when sprint prop changes
  useEffect(() => {
    setName(sprint.name);
    setGoal(sprint.goal || '');
    setStartDate(sprint.startDate ? sprint.startDate.slice(0, 10) : '');
    setEndDate(sprint.endDate ? sprint.endDate.slice(0, 10) : '');
    setStatus(sprint.status);
  }, [sprint]);

  const handleUpdateSprint = async () => {
    try {
      await updateSprint({
        id: sprint.id,
        name,
        goal: goal || undefined,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
      }).unwrap();
      toast.success('Sprint updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update sprint');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateSprint(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Edit Sprint</span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
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
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${goal ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
              <Target className="w-3.5 h-3.5" />
              Goal
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isUpdating || !name.trim()} size="sm" className="gap-1.5 px-5">
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
