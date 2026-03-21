'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDeleteWorkflowMutation } from '@/store/api';

interface WorkflowRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: { id: string; name: string };
}

export default function WorkflowRemove({
  open,
  onOpenChange,
  workflow,
}: WorkflowRemoveProps) {
  const [deleteWorkflow] = useDeleteWorkflowMutation();

  const handleDelete = async () => {
    try {
      await deleteWorkflow(workflow.id).unwrap();
      toast.success('Workflow deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete workflow');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{workflow.name}&quot; and all its steps and transitions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
