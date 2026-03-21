'use client';

import { useState } from 'react';
import { Plus, Loader2, FileText, Building2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateWorkflowMutation } from '@/store/api';

interface WorkflowCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export default function WorkflowCreate({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: WorkflowCreateProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [createWorkflow, { isLoading: isCreating }] = useCreateWorkflowMutation();

  const handleCreate = async () => {
    try {
      await createWorkflow({
        name: workflowName,
        description: workflowDescription || undefined,
        organizationId,
      }).unwrap();
      toast.success('Workflow created');
      onOpenChange(false);
      setWorkflowName('');
      setWorkflowDescription('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create workflow');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Workflow
              </span>
            </div>
          </div>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Describe the purpose of this workflow..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                workflowDescription
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              Issue Type
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {organizationName}
            </div>
            <Button
              type="submit"
              disabled={isCreating || !workflowName.trim()}
              size="sm"
              className="gap-1.5 px-5"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isCreating ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
