'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  useGetTaskSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
} from '@/store/api';

interface SubtaskListProps {
  taskId: string;
  readOnly?: boolean;
}

export default function SubtaskList({ taskId, readOnly = false }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { data: subtasks = [], isLoading } = useGetTaskSubtasksQuery(taskId);
  const [createSubtask, { isLoading: isCreating }] = useCreateSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createSubtask({ taskId, title: newTitle.trim() }).unwrap();
      setNewTitle('');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add subtask');
    }
  };

  const handleToggle = async (subtaskId: string, completed: boolean) => {
    try {
      await updateSubtask({ taskId, subtaskId, completed: !completed }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update subtask');
    }
  };

  const handleEditSave = async (subtaskId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateSubtask({ taskId, subtaskId, title: editTitle.trim() }).unwrap();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update subtask');
    }
  };

  const handleDelete = async (subtaskId: string) => {
    try {
      await deleteSubtask({ taskId, subtaskId }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete subtask');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading subtasks...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completedCount}/{totalCount} completed</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask items */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
          >
            {!readOnly && (
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
            )}
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => !readOnly && handleToggle(subtask.id, subtask.completed)}
              disabled={readOnly}
              className="flex-shrink-0"
            />
            {editingId === subtask.id ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleEditSave(subtask.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave(subtask.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
            ) : (
              <span
                className={`flex-1 text-sm cursor-default ${
                  subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                } ${!readOnly ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (!readOnly) {
                    setEditingId(subtask.id);
                    setEditTitle(subtask.title);
                  }
                }}
              >
                {subtask.title}
              </span>
            )}
            {!readOnly && (
              <button
                onClick={() => handleDelete(subtask.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      {!readOnly && (
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask..."
            className="h-8 text-sm flex-1"
            disabled={isCreating}
          />
          {newTitle.trim() && (
            <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs" disabled={isCreating}>
              {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
