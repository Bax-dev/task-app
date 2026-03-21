'use client';

import { useState } from 'react';
import { Plus, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateLabelMutation } from '@/store/api';
import { toast } from 'sonner';

const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

interface LabelCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export default function LabelCreate({ open, onOpenChange, organizationId, organizationName }: LabelCreateProps) {
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[5]);

  const [createLabel, { isLoading: isCreating }] = useCreateLabelMutation();

  const handleCreate = async () => {
    if (!newLabelName.trim()) return;
    try {
      await createLabel({ name: newLabelName.trim(), color: newLabelColor, organizationId }).unwrap();
      toast.success('Label created');
      onOpenChange(false);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[5]);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create label');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Label
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Label</span>
            </div>
          </div>
          <input
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewLabelColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${newLabelColor === c ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: newLabelColor }} />
              <span className="text-sm text-muted-foreground font-mono">{newLabelColor}</span>
              <span className="text-sm text-muted-foreground ml-2">Preview:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: newLabelColor }}>
                {newLabelName || 'Label'}
              </span>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button type="submit" disabled={isCreating || !newLabelName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreating ? 'Creating...' : 'Create Label'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
