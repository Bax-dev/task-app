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
import { useDeleteSprintMutation } from '@/store/api';

interface SprintRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: { id: string; name: string };
}

export default function SprintRemove({ open, onOpenChange, sprint }: SprintRemoveProps) {
  const [deleteSprint] = useDeleteSprintMutation();

  const handleDelete = async () => {
    try {
      await deleteSprint(sprint.id).unwrap();
      toast.success('Sprint deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete sprint');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{sprint.name}&quot;.
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
