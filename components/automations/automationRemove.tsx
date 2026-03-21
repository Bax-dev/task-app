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
import { useDeleteAutomationMutation } from '@/store/api';

interface AutomationRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: { id: string; name: string };
}

export default function AutomationRemove({
  open,
  onOpenChange,
  automation,
}: AutomationRemoveProps) {
  const [deleteAutomation] = useDeleteAutomationMutation();

  const handleDelete = async () => {
    try {
      await deleteAutomation(automation.id).unwrap();
      toast.success('Automation deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete automation');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Automation</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{automation.name}&quot;. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
