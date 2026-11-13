'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetTaskCommentsQuery,
  useUpdateCommentMutation,
} from '@/store/api';

interface TaskCommentsProps {
  taskId: string;
  currentUserId?: string;
  isAdmin: boolean;
  readOnly?: boolean;
}

const errorMessage = (error: any, fallback: string) => error?.data?.message || error?.message || fallback;

export default function TaskComments({ taskId, currentUserId, isAdmin, readOnly }: TaskCommentsProps) {
  const { data: comments = [], isLoading } = useGetTaskCommentsQuery(taskId);
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isSaving }] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handleAdd = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await createComment({ taskId, content }).unwrap();
      setDraft('');
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to add comment'));
    }
  };

  const handleSave = async (id: string) => {
    const content = editDraft.trim();
    if (!content) return;
    try {
      await updateComment({ id, content }).unwrap();
      setEditingId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update comment'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id).unwrap();
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to delete comment'));
    }
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isOwn = !!currentUserId && c.createdById === currentUserId;
            const author = c.createdBy?.name || c.createdBy?.email || 'Unknown';
            return (
              <li key={c.id} className="group flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                  {author[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">{author}</span>
                    <time dateTime={c.createdAt} className="text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                      {c.updatedAt !== c.createdAt && ' (edited)'}
                    </time>
                    {!readOnly && editingId !== c.id && (
                      <span className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {isOwn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Edit comment"
                            onClick={() => { setEditingId(c.id); setEditDraft(c.content); }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        {(isOwn || isAdmin) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" aria-label="Delete comment">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(c.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </span>
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        autoFocus
                        aria-label="Edit comment"
                        onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" disabled={isSaving || !editDraft.trim()} onClick={() => handleSave(c.id)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap break-words">{c.content}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Add a comment…"
            aria-label="Add a comment"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          />
          <Button size="sm" className="h-7 text-xs" disabled={isCreating || !draft.trim()} onClick={handleAdd}>
            Comment
          </Button>
        </div>
      )}
    </div>
  );
}
