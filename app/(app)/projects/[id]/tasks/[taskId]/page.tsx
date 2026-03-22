'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Trash2, X, AlertTriangle, Pencil, Check, Circle, Square, Triangle, Star, Zap, Bug, Bookmark, Flag, Target, Layers, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGetTaskQuery, useGetProjectQuery, useGetOrgMembersQuery, useGetOrgIssueTypesQuery, useUpdateTaskMutation, useDeleteTaskMutation, useToggleAssignmentMutation } from '@/store/api';

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import FileUpload from '@/components/ui/file-upload';
import SubtaskList from '@/components/tasks/SubtaskList';
import TaskLabelPicker from '@/components/tasks/TaskLabelPicker';

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: projectId, taskId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editDueDate, setEditDueDate] = useState('');

  const { data: task, isLoading } = useGetTaskQuery(taskId);

  const { data: project } = useGetProjectQuery(projectId);

  const orgId = project?.space?.organizationId || project?.space?.organization?.id;

  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const { data: issueTypes = [] } = useGetOrgIssueTypesQuery(orgId!, { skip: !orgId });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN';
  const isGuest = currentUserRole === 'GUEST';

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [toggleAssignment, { isLoading: isAssigning }] = useToggleAssignmentMutation();

  const handleStatusChange = async (value: string) => {
    if (value === 'REJECTED') {
      setRejectionReason('');
      setRejectionDialogOpen(true);
    } else {
      try {
        await updateTask({ id: taskId, status: value }).unwrap();
        toast.success('Task updated');
      } catch (error: any) {
        toast.error(error?.data?.message || error?.message || 'Failed to update');
      }
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await updateTask({ id: taskId, status: 'REJECTED', rejectionReason: rejectionReason.trim() }).unwrap();
      setRejectionDialogOpen(false);
      setRejectionReason('');
      toast.success('Task updated');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) return null;

  const assignedIds = new Set(task.assignments?.map((a: any) => a.user.id) || []);
  const unassignedMembers = members.filter((m: any) => !assignedIds.has(m.id));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Project
      </Link>

      {task.taskNumber && (
        <span className="inline-block text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded mb-3">
          TSK-{task.project?.space?.organization?.slug?.toUpperCase() || 'ORG'}-{task.taskNumber}
        </span>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editTitle.trim() && editTitle.trim() !== task.title) {
                      updateTask({ id: taskId, title: editTitle.trim() }).unwrap()
                        .then(() => { toast.success('Title updated'); setEditingTitle(false); })
                        .catch((err: any) => toast.error(err?.data?.message || 'Failed to update'));
                    } else { setEditingTitle(false); }
                  }
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
              />
              <Button size="sm" onClick={() => {
                if (editTitle.trim() && editTitle.trim() !== task.title) {
                  updateTask({ id: taskId, title: editTitle.trim() }).unwrap()
                    .then(() => { toast.success('Title updated'); setEditingTitle(false); })
                    .catch((err: any) => toast.error(err?.data?.message || 'Failed to update'));
                } else { setEditingTitle(false); }
              }} disabled={isUpdating}>
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{task.title}</h1>
              {!isGuest && (
                <button onClick={() => { setEditTitle(task.title); setEditingTitle(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {editingDesc ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Add a description..."
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingDesc(false);
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => {
                  updateTask({ id: taskId, description: editDesc.trim() || null }).unwrap()
                    .then(() => { toast.success('Description updated'); setEditingDesc(false); })
                    .catch((err: any) => toast.error(err?.data?.message || 'Failed to update'));
                }}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="group flex items-start gap-2 mt-2">
              <p className="text-muted-foreground">{task.description || (isGuest ? '' : 'No description')}</p>
              {!isGuest && (
                <button onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mt-0.5">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {!isGuest && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await deleteTask(taskId).unwrap();
                      toast.success('Task deleted');
                      router.push(`/projects/${projectId}`);
                    } catch (error: any) {
                      toast.error(error?.data?.message || error?.message || 'Failed to delete');
                    }
                  }}
                  className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Rejection Reason Banner */}
      {task.rejectionReason && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Task Rejected</p>
            <p className="text-sm mt-1">{task.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Status & Priority */}
      {!isGuest && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                {isAdmin && <SelectItem value="REJECTED">Rejected</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={task.priority} onValueChange={async (value) => {
              try {
                await updateTask({ id: taskId, priority: value }).unwrap();
                toast.success('Task updated');
              } catch (error: any) {
                toast.error(error?.data?.message || error?.message || 'Failed to update');
              }
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Read-only status/priority for guests */}
      {isGuest && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <Label>Status</Label>
            <p className="text-sm font-medium px-3 py-2 rounded-md border border-input bg-muted/50">{task.status}</p>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <p className="text-sm font-medium px-3 py-2 rounded-md border border-input bg-muted/50">{task.priority}</p>
          </div>
        </div>
      )}

      {/* Issue Type */}
      {!isGuest && issueTypes.length > 0 && (
        <div className="mb-8">
          <div className="space-y-2">
            <Label>Issue Type</Label>
            <Select
              value={task.issueTypeId || ''}
              onValueChange={async (value) => {
                try {
                  await updateTask({ id: taskId, issueTypeId: value || null }).unwrap();
                  toast.success('Issue type updated');
                } catch (error: any) {
                  toast.error(error?.data?.message || error?.message || 'Failed to update');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type">
                  {task.issueType ? (() => {
                    const Icon = ICON_MAP[task.issueType.icon] || Circle;
                    return (
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: task.issueType.color }} />
                        {task.issueType.name}
                      </span>
                    );
                  })() : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((it: any) => {
                  const Icon = ICON_MAP[it.icon] || Circle;
                  return (
                    <SelectItem key={it.id} value={it.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color: it.color }} />
                        {it.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Read-only issue type for guests */}
      {isGuest && task.issueType && (
        <div className="mb-8">
          <div className="space-y-2">
            <Label>Issue Type</Label>
            <p className="text-sm font-medium px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center gap-2">
              {(() => { const Icon = ICON_MAP[task.issueType.icon] || Circle; return <Icon className="w-3.5 h-3.5" style={{ color: task.issueType.color }} />; })()}
              {task.issueType.name}
            </p>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this task.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRejectionSubmit}
              disabled={isUpdating || !rejectionReason.trim()}
            >
              Reject Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignees */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Assigned Members</h3>

        {task.assignments && task.assignments.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.assignments.map((a: any) => {
              const canUnassign = isAdmin || a.user.id === currentUser?.id;
              return (
                <div
                  key={a.user.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {(a.user.name?.[0] || a.user.email[0]).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{a.user.name || a.user.email}</span>
                  {canUnassign && (
                    <button
                      onClick={() => toggleAssignment({ taskId, userId: a.user.id })}
                      disabled={isAssigning}
                      className="hover:text-foreground transition-colors"
                      title={a.user.id === currentUser?.id ? 'Unassign yourself' : 'Unassign'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No one assigned yet</p>
        )}

        {/* Admin-only: assign from dropdown */}
        {isAdmin && unassignedMembers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Assign member</Label>
            <Select onValueChange={(userId) => toggleAssignment({ taskId, userId })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a member to assign" />
              </SelectTrigger>
              <SelectContent>
                {unassignedMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Labels */}
      {orgId && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tags className="w-4 h-4" />
            Labels
          </h3>
          <TaskLabelPicker
            taskId={taskId}
            orgId={orgId}
            taskLabels={(task as any).taskLabels || []}
            readOnly={isGuest}
          />
        </div>
      )}

      {/* Subtasks / Checklist */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Subtasks</h3>
        <SubtaskList taskId={taskId} readOnly={isGuest} />
      </div>

      {/* Attachments */}
      {!isGuest && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Attachments</h3>
          <FileUpload taskId={taskId} attachments={task.attachments || []} />
        </div>
      )}

      {/* Details */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created by</span>
          <span className="text-sm font-medium">{task.createdBy?.name || task.createdBy?.email || '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Due Date</span>
          {editingDueDate ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="h-8 w-auto text-sm"
              />
              <Button size="sm" className="h-7 text-xs" onClick={() => {
                updateTask({ id: taskId, dueDate: editDueDate ? new Date(editDueDate).toISOString() : null }).unwrap()
                  .then(() => { toast.success('Due date updated'); setEditingDueDate(false); })
                  .catch((err: any) => toast.error(err?.data?.message || 'Failed to update'));
              }} disabled={isUpdating}>
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDueDate(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <span className="text-sm font-medium">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
              </span>
              {!isGuest && (
                <button onClick={() => {
                  setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                  setEditingDueDate(true);
                }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="text-sm font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Project</span>
          <Link href={`/projects/${projectId}`} className="text-sm font-medium text-primary hover:underline">
            {task.project?.name || '-'}
          </Link>
        </div>
      </div>
    </div>
  );
}
