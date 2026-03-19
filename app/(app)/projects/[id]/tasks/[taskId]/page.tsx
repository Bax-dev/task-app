'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Trash2, X, AlertTriangle } from 'lucide-react';
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
import { useGetTaskQuery, useGetProjectQuery, useGetOrgMembersQuery, useUpdateTaskMutation, useDeleteTaskMutation, useToggleAssignmentMutation } from '@/store/api';
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

  const { data: task, isLoading } = useGetTaskQuery(taskId);

  const { data: project } = useGetProjectQuery(projectId);

  const orgId = project?.space?.organizationId || project?.space?.organization?.id;

  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });

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

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{task.title}</h1>
          {task.description && (
            <p className="text-muted-foreground mt-2">{task.description}</p>
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

      {/* Assignees - Admin only can manage */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Assigned Members</h3>

        {task.assignments && task.assignments.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.assignments.map((a: any) => (
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
                {isAdmin && (
                  <button
                    onClick={() => toggleAssignment({ taskId, userId: a.user.id })}
                    disabled={isAssigning}
                    className="hover:text-foreground transition-colors"
                    title="Unassign"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
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
        {task.dueDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Due Date</span>
            <span className="text-sm font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
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
