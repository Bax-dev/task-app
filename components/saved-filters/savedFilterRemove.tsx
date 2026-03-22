'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDeleteSavedFilterMutation } from '@/store/api';

interface SavedFilterRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: { id: string; name: string };
  onDeleted?: () => void;
}

export default function SavedFilterRemove({
  open,
  onOpenChange,
  filter,
  onDeleted,
}: SavedFilterRemoveProps) {
  const [deleteSavedFilter] = useDeleteSavedFilterMutation();

  const handleDeleteFilter = async () => {
    try {
      await deleteSavedFilter(filter.id).unwrap();
      toast.success('Filter deleted');
      onOpenChange(false);
      onDeleted?.();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete filter');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Filter</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{filter.name}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteFilter}
            className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
