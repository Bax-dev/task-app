'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Trash2,
  X,
  AlertTriangle,
  Pencil,
  Check,
  Circle,
  Square,
  Triangle,
  Star,
  Zap,
  Bug,
  Bookmark,
  Flag,
  Target,
  Layers,
  Tags,
  Users,
  AtSign,
  Calendar,
} from 'lucide-react';
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
import {
  useBulkAssignTaskMembersMutation,
  useDeleteTaskMutation,
  useGetOrgIssueTypesQuery,
  useGetOrgMembersQuery,
  useGetProjectQuery,
  useGetSpaceMembersQuery,
  useGetTaskQuery,
  useToggleAssignmentMutation,
  useUpdateTaskMutation,
} from '@/store/api';
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
import type { Member } from '@/types/organization';

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-zinc-400',
  REJECTED: 'bg-red-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-blue-600',
  MEDIUM: 'text-muted-foreground',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

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
  const [assignSearch, setAssignSearch] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const assignInputRef = useRef<HTMLInputElement>(null);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  const { data: task, isLoading } = useGetTaskQuery(taskId);
  const { data: project } = useGetProjectQuery(projectId);

  const orgId = project?.space?.organizationId || project?.space?.organization?.id;

  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const { data: issueTypes = [] } = useGetOrgIssueTypesQuery(orgId!, { skip: !orgId });
  const { data: rawSpaceMembers = [] } = useGetSpaceMembersQuery(task?.project?.spaceId!, { skip: !task?.project?.spaceId });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN';
  const isGuest = currentUserRole === 'GUEST';

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [toggleAssignment, { isLoading: isAssigning }] = useToggleAssignmentMutation();
  const [bulkAssignTaskMembers, { isLoading: isBulkAssigning }] = useBulkAssignTaskMembersMutation();

  const assignedIds = useMemo(
    () => new Set(task?.assignments?.map((a: any) => a.user.id) || []),
    [task?.assignments]
  );

  const memberRoleMap = useMemo(
    () => new Map(members.map((member: Member) => [member.id, member.role])),
    [members]
  );

  const spaceMembers = useMemo(
    () =>
      rawSpaceMembers.map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: memberRoleMap.get(member.user.id) || 'MEMBER',
      })),
    [memberRoleMap, rawSpaceMembers]
  );

  const unassignedMembers = useMemo(
    () => spaceMembers.filter((m: Member) => !assignedIds.has(m.id)),
    [spaceMembers, assignedIds]
  );

  const filteredUnassignedMembers = useMemo(() => {
    const search = assignSearch.trim().toLowerCase();
    return unassignedMembers.filter((member: Member) => {
      if (!search) return true;
      return (
        member.name?.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search)
      );
    });
  }, [assignSearch, unassignedMembers]);

  const assignSearchValue = assignSearch.trim().toLowerCase();
  const assignmentOptions = useMemo(() => {
    const options: Array<{ id: 'space' | 'all'; label: string }> = [];
    const search = assignSearchValue;
    const matches = (value: string) =>
      !search || value.toLowerCase().includes(search) || `@${value.toLowerCase()}`.includes(search);

    if (matches('space')) {
      options.push({ id: 'space', label: `Assign whole space` });
    }
    if (unassignedMembers.length > 0 && matches('all')) {
      options.push({ id: 'all', label: `Assign all members` });
    }
    return options;
  }, [assignSearchValue, unassignedMembers.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target as Node)) {
        setShowAssignDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAssignActionBusy = isUpdating || isAssigning || isBulkAssigning;

  const updateField = async (patch: Record<string, any>, successMessage?: string) => {
    try {
      await updateTask({ id: taskId, ...patch }).unwrap();
      if (successMessage) toast.success(successMessage);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'REJECTED' && task?.status !== 'REJECTED') {
      setRejectionReason(task?.rejectionReason || '');
      setRejectionDialogOpen(true);
      return;
    }
    updateField({ status: newStatus }, 'Status updated');
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    try {
      await updateTask({ id: taskId, status: 'REJECTED', rejectionReason: rejectionReason.trim() }).unwrap();
      setRejectionDialogOpen(false);
      setRejectionReason('');
      toast.success('Task rejected');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  const ensureIndividualAssignments = async () => {
    if (!task?.assignToSpace) return;
    await updateTask({ id: taskId, assignToSpace: false }).unwrap();
  };

  const resetAssignPicker = () => {
    setAssignSearch('');
    setShowAssignDropdown(false);
  };

  const handleAssignMember = async (userId: string) => {
    try {
      await ensureIndividualAssignments();
      await toggleAssignment({ taskId, userId }).unwrap();
      resetAssignPicker();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to assign');
    }
  };

  const handleAssignOption = async (optionId: 'space' | 'all') => {
    try {
      if (optionId === 'space') {
        await updateTask({ id: taskId, assignToSpace: true }).unwrap();
        resetAssignPicker();
        toast.success('Whole space assigned');
        return;
      }
      if (unassignedMembers.length === 0) return;
      await ensureIndividualAssignments();
      await bulkAssignTaskMembers({ taskId, userIds: unassignedMembers.map((m) => m.id) }).unwrap();
      resetAssignPicker();
      toast.success(`Assigned ${unassignedMembers.length}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  if (isLoading) {
    return <TaskDetailSkeleton />;
  }

  if (!task) return null;

  const selectedIssueType = task.issueType;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {task.project?.name || 'Project'}
      </Link>

      {/* Header bar */}
      <div className="flex items-start gap-3 mb-5">
        <span className={`mt-2 h-2.5 w-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status] || 'bg-slate-400'}`} />
        <div className="flex-1 min-w-0">
          {task.taskNumber && (
            <span className="inline-block text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mb-1.5">
              {task.project?.space?.organization?.slug?.toUpperCase() || 'ORG'}-{task.taskNumber}
            </span>
          )}
          {editingTitle ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl sm:text-2xl font-semibold h-auto py-1 border-0 shadow-none focus-visible:ring-1 px-2 -mx-2"
              autoFocus
              onBlur={() => {
                if (editTitle.trim() && editTitle.trim() !== task.title) {
                  updateField({ title: editTitle.trim() }, 'Title updated');
                }
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
            />
          ) : (
            <h1
              className={`text-xl sm:text-2xl font-semibold tracking-tight text-foreground ${!isGuest ? 'cursor-text hover:bg-secondary/30 rounded px-2 -mx-2' : ''}`}
              onClick={() => { if (!isGuest) { setEditTitle(task.title); setEditingTitle(true); } }}
            >
              {task.title}
            </h1>
          )}
        </div>
        {!isGuest && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {task.rejectionReason && (
        <div className="flex items-start gap-2.5 p-3 mb-5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Rejected</p>
            <p className="mt-0.5">{task.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-5 min-w-0">
          {/* Description */}
          <section>
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editingDesc ? (
              <div className="mt-1.5 space-y-2">
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder="Add description…"
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditingDesc(false); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => {
                    updateField({ description: editDesc.trim() || null }, 'Description updated');
                    setEditingDesc(false);
                  }}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDesc(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isGuest}
                onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true); }}
                className={`mt-1.5 w-full text-left rounded-lg border border-transparent p-3 min-h-[60px] text-sm ${
                  task.description ? 'text-foreground' : 'text-muted-foreground italic'
                } ${!isGuest ? 'hover:border-border hover:bg-secondary/20' : ''}`}
              >
                {task.description || 'Add description…'}
              </button>
            )}
          </section>

          {/* Subtasks */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Subtasks</h3>
            <SubtaskList taskId={taskId} taskTitle={task?.title} taskDescription={task?.description || undefined} readOnly={isGuest} />
          </section>

          {/* Attachments */}
          {!isGuest && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Attachments</h3>
              <FileUpload taskId={taskId} attachments={task.attachments || []} />
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="space-y-1 lg:border-l lg:border-border lg:pl-5">
          {/* Status */}
          <SideField label="Status">
            {isGuest ? (
              <span className="text-sm">{task.status}</span>
            ) : (
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 border-0 shadow-none bg-transparent hover:bg-secondary/50 px-2">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[task.status]}`} />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  {isAdmin && <SelectItem value="REJECTED">Rejected</SelectItem>}
                </SelectContent>
              </Select>
            )}
          </SideField>

          {/* Priority */}
          <SideField label="Priority">
            {isGuest ? (
              <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
            ) : (
              <Select value={task.priority} onValueChange={(v) => updateField({ priority: v }, 'Priority updated')}>
                <SelectTrigger className="h-8 border-0 shadow-none bg-transparent hover:bg-secondary/50 px-2">
                  <span className={`flex items-center gap-2 ${PRIORITY_COLORS[task.priority] || ''}`}>
                    <Flag className="w-3 h-3" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            )}
          </SideField>

          {/* Issue type */}
          {issueTypes.length > 0 && (
            <SideField label="Type">
              {isGuest ? (
                selectedIssueType ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    {(() => { const Icon = ICON_MAP[selectedIssueType.icon] || Circle; return <Icon className="w-3 h-3" style={{ color: selectedIssueType.color }} />; })()}
                    {selectedIssueType.name}
                  </span>
                ) : <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <Select
                  value={task.issueTypeId || ''}
                  onValueChange={(v) => updateField({ issueTypeId: v || null }, 'Type updated')}
                >
                  <SelectTrigger className="h-8 border-0 shadow-none bg-transparent hover:bg-secondary/50 px-2">
                    <SelectValue placeholder="—">
                      {selectedIssueType ? (() => {
                        const Icon = ICON_MAP[selectedIssueType.icon] || Circle;
                        return (
                          <span className="flex items-center gap-2">
                            <Icon className="w-3 h-3" style={{ color: selectedIssueType.color }} />
                            {selectedIssueType.name}
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
                            <Icon className="w-3 h-3" style={{ color: it.color }} />
                            {it.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </SideField>
          )}

          {/* Due date */}
          <SideField label="Due">
            {editingDueDate && !isGuest ? (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                  onBlur={() => {
                    updateField({ dueDate: editDueDate ? new Date(editDueDate).toISOString() : null }, 'Due date updated');
                    setEditingDueDate(false);
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                disabled={isGuest}
                onClick={() => {
                  setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                  setEditingDueDate(true);
                }}
                className={`flex items-center gap-1.5 text-sm rounded px-2 py-1 -mx-2 ${!isGuest ? 'hover:bg-secondary/50' : ''}`}
              >
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-muted-foreground">Not set</span>}
              </button>
            )}
          </SideField>

          {/* Assignees */}
          <SideField label={`Assignees${task.assignments?.length ? ` · ${task.assignments.length}` : ''}`}>
            {task.assignToSpace ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">
                <Users className="w-3 h-3" />
                Whole space
                {isAdmin && (
                  <button
                    onClick={async () => {
                      try {
                        await updateTask({ id: taskId, assignToSpace: false }).unwrap();
                      } catch (error: any) {
                        toast.error(error?.data?.message || 'Failed');
                      }
                    }}
                    disabled={isAssignActionBusy}
                    className="hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : task.assignments && task.assignments.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {task.assignments.map((a: any) => {
                  const canUnassign = isAdmin || a.user.id === currentUser?.id;
                  return (
                    <div key={a.user.id} className="group inline-flex items-center gap-1 rounded-md bg-secondary/50 pl-0.5 pr-1.5 py-0.5 text-xs">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[9px] font-semibold text-primary">
                          {(a.user.name?.[0] || a.user.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate max-w-[90px]">{a.user.name?.split(' ')[0] || a.user.email.split('@')[0]}</span>
                      {canUnassign && (
                        <button
                          onClick={() => toggleAssignment({ taskId, userId: a.user.id })}
                          disabled={isAssigning}
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}

            {isAdmin && (
              <div ref={assignDropdownRef} className="relative mt-1.5">
                <div className="relative">
                  <AtSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    ref={assignInputRef}
                    value={assignSearch}
                    onChange={(e) => {
                      setAssignSearch(e.target.value);
                      setShowAssignDropdown(true);
                    }}
                    onFocus={() => setShowAssignDropdown(true)}
                    placeholder="Add member, @all, @space"
                    className="pl-7 h-7 text-xs"
                    disabled={isAssignActionBusy}
                  />
                </div>
                {showAssignDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-auto">
                    {assignmentOptions.length > 0 || filteredUnassignedMembers.length > 0 ? (
                      <>
                        {assignmentOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleAssignOption(option.id)}
                            disabled={isAssignActionBusy}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-secondary/50 transition-colors text-left text-xs"
                          >
                            <Users className="w-3 h-3 text-primary" />
                            <span className="text-foreground">{option.label}</span>
                          </button>
                        ))}
                        {filteredUnassignedMembers.map((member: Member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => handleAssignMember(member.id)}
                            disabled={isAssignActionBusy}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-secondary/50 transition-colors text-left text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-semibold text-primary flex-shrink-0">
                              {(member.name?.[0] || member.email[0]).toUpperCase()}
                            </span>
                            <span className="truncate">{member.name || member.email}</span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <p className="px-2.5 py-2 text-xs text-muted-foreground">No matches</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </SideField>

          {/* Labels */}
          {orgId && (
            <SideField label="Labels" icon={<Tags className="w-3 h-3" />}>
              <TaskLabelPicker
                taskId={taskId}
                orgId={orgId}
                taskLabels={(task as any).taskLabels || []}
                readOnly={isGuest}
              />
            </SideField>
          )}

          <div className="pt-3 mt-2 border-t border-border space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <span>Created by</span>
              <span className="text-foreground truncate">{task.createdBy?.name || task.createdBy?.email || '—'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Created</span>
              <span className="text-foreground">{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Project</span>
              <Link href={`/projects/${projectId}`} className="text-primary hover:underline truncate">
                {task.project?.name || '—'}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Rejection dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject task</DialogTitle>
            <DialogDescription>Provide a reason.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectionSubmit} disabled={isUpdating || !rejectionReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SideField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function TaskDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-2/3 mb-5" />
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </div>
  );
}
