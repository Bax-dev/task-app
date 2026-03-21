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
import { useDeleteLabelMutation } from '@/store/api';
import { toast } from 'sonner';

interface LabelRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: { id: string; name: string; color: string };
}

export default function LabelRemove({ open, onOpenChange, label }: LabelRemoveProps) {
  const [deleteLabel] = useDeleteLabelMutation();

  const handleDelete = async () => {
    try {
      await deleteLabel(label.id).unwrap();
      toast.success('Label deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete label');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Label</AlertDialogTitle>
          <AlertDialogDescription>
            <span>This will permanently delete the label </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white mx-1"
              style={{ backgroundColor: label.color || '#64748b' }}
            >
              {label.name}
            </span>
            <span> and remove it from all tasks.</span>
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
