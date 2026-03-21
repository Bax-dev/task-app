'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { useDeleteIntegrationMutation } from '@/store/api';

interface IntegrationRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: { id: string; name: string; type: string };
}

export default function IntegrationRemove({
  open,
  onOpenChange,
  integration,
}: IntegrationRemoveProps) {
  const [deleteIntegration, { isLoading: isDeleting }] = useDeleteIntegrationMutation();

  const handleDelete = async () => {
    try {
      await deleteIntegration(integration.id).unwrap();
      toast.success('Integration deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete integration');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Integration</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{integration.name}&quot;.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
