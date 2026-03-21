'use client';

import { useState } from 'react';
import { Plus, Loader2, FolderOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateBoardMutation } from '@/store/api';

interface BoardCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export default function BoardCreate({ open, onOpenChange, projectId, projectName }: BoardCreateProps) {
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [createBoard, { isLoading: isCreatingBoard }] = useCreateBoardMutation();

  const handleCreateBoard = async () => {
    try {
      await createBoard({
        name: boardName,
        description: boardDescription || undefined,
        projectId,
      }).unwrap();
      toast.success('Board created');
      onOpenChange(false);
      setBoardName('');
      setBoardDescription('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create board');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleCreateBoard(); }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Board</span>
            </div>
          </div>
          <input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="Board Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={boardDescription}
            onChange={(e) => setBoardDescription(e.target.value)}
            placeholder="Add a description..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              <FolderOpen className="w-3.5 h-3.5" />
              {projectName || 'Project'}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${boardDescription ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
              <FileText className="w-3.5 h-3.5" />
              Description
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-end">
            <Button type="submit" disabled={isCreatingBoard || !boardName.trim()} size="sm" className="gap-1.5 px-5">
              {isCreatingBoard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreatingBoard ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
