'use client';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDeleteBoardMutation } from '@/store/api';

interface BoardRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: { id: string; name: string };
  onRemoved?: () => void;
}

export default function BoardRemove({ open, onOpenChange, board, onRemoved }: BoardRemoveProps) {
  const [deleteBoard] = useDeleteBoardMutation();

  const handleDelete = async () => {
    try {
      await deleteBoard(board.id).unwrap();
      toast.success('Board deleted');
      onOpenChange(false);
      onRemoved?.();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete board');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Board</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{board.name}&quot; and all its columns.
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
