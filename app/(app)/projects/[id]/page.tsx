'use client';

import { use, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ArrowLeft, Loader2, X, AtSign, Users, Circle, Square, Triangle, Star, Zap, Bug, Bookmark, Flag, Target, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useGetProjectQuery,
  useGetProjectTasksQuery,
  useGetOrgMembersQuery,
  useGetOrgIssueTypesQuery,
  useCreateTaskMutation,
} from '@/store/api';

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};
import TaskBoard from '@/components/tasks/board/TaskBoard';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Member } from '@/types/organization';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useGetProjectQuery(id);
  const { data: tasks = [], isLoading: tasksLoading } = useGetProjectTasksQuery(id);

  const orgId = project?.space?.organizationId;
  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const isGuest = members.find((m: any) => m.id === currentUser?.id)?.role === 'GUEST';

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  const tasksByStatus = {
    TODO: tasks.filter((t: any) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t: any) => t.status === 'DONE'),
    CANCELLED: tasks.filter((t: any) => t.status === 'CANCELLED'),
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <Link
          href={`/spaces/${project.spaceId || project.space?.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Space
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          {!isGuest && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Task</DialogTitle>
                </DialogHeader>
                <NewTaskModal
                  projectId={id}
                  members={members}
                  orgId={orgId || ''}
                  onCreated={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <TaskBoard projectId={id} tasksByStatus={tasksByStatus} />
    </div>
  );
}

function NewTaskModal({
  projectId,
  members,
  orgId,
  onCreated,
}: {
  projectId: string;
  members: Member[];
  orgId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');

  // Assignment
  const [assignedUsers, setAssignedUsers] = useState<Member[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const assignRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: issueTypes = [] } = useGetOrgIssueTypesQuery(orgId, { skip: !orgId });

  const filteredMembers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((u) => u.id));
    const search = assignSearch.replace(/^@/, '').toLowerCase();
    return members.filter(
      (m) => !assignedIds.has(m.id) && (m.name?.toLowerCase().includes(search) || m.email.toLowerCase().includes(search))
    );
  }, [members, assignedUsers, assignSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAssignInput = (value: string) => {
    setAssignSearch(value);
    if (value.toLowerCase() === '@all') {
      const assignedIds = new Set(assignedUsers.map((u) => u.id));
      const newMembers = members.filter((m) => !assignedIds.has(m.id));
      setAssignedUsers([...assignedUsers, ...newMembers]);
      setAssignSearch('');
      setShowDropdown(false);
      return;
    }
    setShowDropdown(value.length > 0);
  };

  const addAssignee = (member: Member) => {
    setAssignedUsers((prev) => [...prev, member]);
    setAssignSearch('');
    setShowDropdown(false);
    assignRef.current?.focus();
  };

  const removeAssignee = (userId: string) => {
    setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        title,
        description: description || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId,
        assigneeIds: assignedUsers.length > 0 ? assignedUsers.map((u) => u.id) : undefined,
        issueTypeId: issueTypeId || null,
      }).unwrap();
      toast.success('Task created!');
      onCreated();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="modal-title">Title</Label>
        <Input
          id="modal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="modal-desc">Description</Label>
        <Textarea
          id="modal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Low</span></SelectItem>
              <SelectItem value="MEDIUM"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span></SelectItem>
              <SelectItem value="HIGH"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span></SelectItem>
              <SelectItem value="URGENT"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Urgent</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-xs" />
        </div>
      </div>

      {/* Issue Type */}
      {issueTypes.length > 0 && (
        <div className="space-y-2">
          <Label>Issue Type</Label>
          <Select value={issueTypeId} onValueChange={setIssueTypeId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select type (optional)" />
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
      )}

      {/* Assign */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Assign
        </Label>

        {assignedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assignedUsers.map((m) => (
              <Badge key={m.id} variant="secondary" className="gap-1 pr-1 text-xs">
                {m.name || m.email.split('@')[0]}
                <button type="button" onClick={() => removeAssignee(m.id)} className="ml-0.5 p-0.5 rounded-full hover:bg-muted">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div ref={dropdownRef}>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              ref={assignRef}
              value={assignSearch}
              onChange={(e) => handleAssignInput(e.target.value)}
              onFocus={() => { if (assignSearch.length > 0) setShowDropdown(true); }}
              placeholder=""
              className="pl-8 h-9 text-sm"
            />
          </div>
          {showDropdown && (
            <div className="mt-1 bg-card border border-border rounded-lg shadow-lg max-h-36 overflow-auto">
              {assignSearch.toLowerCase().startsWith('@al') && assignSearch.toLowerCase() !== '@all' && (
                <button
                  type="button"
                  onClick={() => handleAssignInput('@all')}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 text-left text-sm border-b border-border"
                >
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">Assign everyone</span>
                  <span className="text-xs text-muted-foreground ml-auto">{members.length}</span>
                </button>
              )}
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addAssignee(m)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 text-left text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {(m.name?.[0] || m.email[0]).toUpperCase()}
                    </span>
                    <span className="truncate">{m.name || m.email}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto capitalize">{m.role.toLowerCase()}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isLoading || !title.trim()} className="flex-1">
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
        {assignedUsers.length > 0 && (
          <span className="text-xs text-muted-foreground">{assignedUsers.length} assignee{assignedUsers.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </form>
  );
}
