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
import { useDeleteDashboardMutation } from '@/store/api';

interface DashboardRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: { id: string; name: string };
}

export default function DashboardRemove({
  open,
  onOpenChange,
  dashboard,
}: DashboardRemoveProps) {
  const [deleteDashboard] = useDeleteDashboardMutation();

  const handleDelete = async () => {
    try {
      await deleteDashboard(dashboard.id).unwrap();
      toast.success('Dashboard deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete dashboard');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{dashboard.name}&quot;.
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
