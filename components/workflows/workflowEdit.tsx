'use client';

import { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateWorkflowMutation } from '@/store/api';

interface WorkflowEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: { id: string; name: string; description: string | null };
}

export default function WorkflowEdit({
  open,
  onOpenChange,
  workflow,
}: WorkflowEditProps) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || '');
  const [updateWorkflow, { isLoading }] = useUpdateWorkflowMutation();

  useEffect(() => {
    if (open) {
      setName(workflow.name);
      setDescription(workflow.description || '');
    }
  }, [open, workflow]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateWorkflow({
        id: workflow.id,
        name: name.trim(),
        description: description.trim() || undefined,
      }).unwrap();
      toast.success('Workflow updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update workflow');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Edit Workflow
              </span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this workflow..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                description
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              size="sm"
              className="gap-1.5 px-5"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
