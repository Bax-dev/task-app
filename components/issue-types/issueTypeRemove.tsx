'use client';

import {
  Loader2, Circle, Square, Triangle, Star,
  Zap, Bug, Bookmark, Flag, Target, Layers, LucideIcon,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDeleteIssueTypeMutation } from '@/store/api';

// ─── Constants ───

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle;
}

// ─── Component ───

interface IssueTypeRemoveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueType: { id: string; name: string; icon: string; color: string };
}

export default function IssueTypeRemove({ open, onOpenChange, issueType }: IssueTypeRemoveProps) {
  const [deleteIssueType, { isLoading }] = useDeleteIssueTypeMutation();

  const IconComp = getIconComponent(issueType.icon);
  const typeColor = issueType.color || '#64748b';

  const handleDelete = async () => {
    try {
      await deleteIssueType(issueType.id).unwrap();
      toast.success('Issue type deleted');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete issue type');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${typeColor}20` }}
            >
              <IconComp className="w-4 h-4" style={{ color: typeColor }} />
            </div>
            Delete Issue Type
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the issue type &quot;{issueType.name}&quot; and may affect tasks using it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
