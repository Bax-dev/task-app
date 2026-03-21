'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
import { CheckCircle, AlertCircle, Circle, XCircle, Loader2, Plus, Search, Users, AtSign, X, Square, Triangle, Star, Zap, Bug, Bookmark, Flag, Target, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, selectView } from '@/store/slices/viewSlice';
import { toast } from 'sonner';
import { useGetUserTasksQuery, useGetProjectsQuery, useCreateTaskMutation, useUpdateTaskMutation, useGetOrgMembersQuery, useGetOrgIssueTypesQuery } from '@/store/api';
import type { Member } from '@/types/organization';

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle, square: Square, triangle: Triangle, star: Star,
  zap: Zap, bug: Bug, bookmark: Bookmark, flag: Flag, target: Target, layers: Layers,
};

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView('tasks'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [open, setOpen] = useState(false);

  const { data: tasks = [], isLoading } = useGetUserTasksQuery();
  const { data: projects = [] } = useGetProjectsQuery();
  const [updateTask] = useUpdateTaskMutation();

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await updateTask({ id: taskId, status: newStatus }).unwrap();
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

  const todoTasks = tasks.filter((t: any) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t: any) => t.status === 'DONE');
  const cancelledTasks = tasks.filter((t: any) => t.status === 'CANCELLED');
  const rejectedTasks = tasks.filter((t: any) => t.status === 'REJECTED');

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-500/10 text-red-600 border-red-200',
    HIGH: 'bg-orange-500/10 text-orange-600 border-orange-200',
    MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const sections = [
    { key: 'TODO', label: 'To Do', tasks: todoTasks, dot: 'bg-blue-500', icon: <Circle className="w-4 h-4 text-blue-500" /> },
    { key: 'IN_PROGRESS', label: 'In Progress', tasks: inProgressTasks, dot: 'bg-yellow-500', icon: <AlertCircle className="w-4 h-4 text-yellow-500" /> },
    { key: 'DONE', label: 'Done', tasks: doneTasks, dot: 'bg-green-500', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { key: 'CANCELLED', label: 'Cancelled', tasks: cancelledTasks, dot: 'bg-gray-400', icon: <XCircle className="w-4 h-4 text-gray-400" /> },
    { key: 'REJECTED', label: 'Rejected', tasks: rejectedTasks, dot: 'bg-red-500', icon: <XCircle className="w-4 h-4 text-red-500" /> },
  ];

  const searchLower = search.toLowerCase();
  const searchedSections = sections.map(s => ({
    ...s,
    tasks: search
      ? s.tasks.filter((t: any) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.project?.name?.toLowerCase().includes(searchLower)
        )
      : s.tasks,
  }));
  const filteredSections = statusFilter === 'ALL' ? searchedSections : searchedSections.filter(s => s.key === statusFilter);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Tasks assigned to you across all projects</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={(v) => dispatch(setView({ page: 'tasks', mode: v }))} />
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <CreateTaskForm projects={projects} onCreated={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {sections.map((s) => (
          <div key={s.key} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.tasks.length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Status Filter Toggle Bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { key: 'ALL', label: 'All', count: tasks.length },
          { key: 'TODO', label: 'To Do', dot: 'bg-blue-500', count: todoTasks.length },
          { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-yellow-500', count: inProgressTasks.length },
          { key: 'DONE', label: 'Done', dot: 'bg-green-500', count: doneTasks.length },
          { key: 'REJECTED', label: 'Rejected', dot: 'bg-red-500', count: rejectedTasks.length },
          { key: 'CANCELLED', label: 'Cancelled', dot: 'bg-gray-400', count: cancelledTasks.length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
            {f.label}
            <span className="text-xs opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {tasks.length > 0 ? (
        view === 'grid' ? (
          /* ─── Grid View ─── */
          <div className="space-y-8">
            {filteredSections.map((section) =>
              section.tasks.length > 0 ? (
                <div key={section.key}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${section.dot}`} />
                    <h2 className="text-lg font-bold text-foreground">{section.label}</h2>
                    <span className="text-sm text-muted-foreground ml-1">({section.tasks.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.tasks.map((task: any) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                      return (
                        <div
                          key={task.id}
                          className={`bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors ${
                            isOverdue ? 'border-red-300 dark:border-red-800' : 'border-border'
                          }`}
                        >
                          <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
                            <h3 className="font-medium text-foreground hover:text-primary text-sm mb-2 line-clamp-2">
                              {task.title}
                            </h3>
                          </Link>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ''}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{task.project?.name}</span>
                          </div>
                          {task.dueDate && (
                            <p className={`text-xs mb-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              {isOverdue ? 'Overdue: ' : 'Due: '}{new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex gap-1 pt-2 border-t border-border">
                            {task.status !== 'TODO' && (
                              <button onClick={() => handleStatusUpdate(task.id, 'TODO')} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">To Do</button>
                            )}
                            {task.status !== 'IN_PROGRESS' && (
                              <button onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')} className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors">In Progress</button>
                            )}
                            {task.status !== 'DONE' && (
                              <button onClick={() => handleStatusUpdate(task.id, 'DONE')} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">Done</button>
                            )}
                          </div>
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="flex -space-x-1 mt-3">
                              {task.assignments.slice(0, 4).map((a: any) => (
                                <div key={a.user.id} className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card" title={a.user.name || a.user.email}>
                                  <span className="text-[10px] font-bold text-primary">{(a.user.name?.[0] || a.user.email[0]).toUpperCase()}</span>
                                </div>
                              ))}
                              {task.assignments.length > 4 && (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-card">
                                  <span className="text-[10px] font-bold text-muted-foreground">+{task.assignments.length - 4}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          /* ─── List View ─── */
          <div className="space-y-6">
            {filteredSections.map((section) =>
              section.tasks.length > 0 ? (
                <div key={section.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${section.dot}`} />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{section.label}</h2>
                    <span className="text-xs text-muted-foreground">({section.tasks.length})</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="border-b border-border bg-secondary/30">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Task</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Project</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Priority</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Due</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Assignees</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.tasks.map((task: any) => {
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                          return (
                            <tr key={task.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3">
                                <Link href={`/projects/${task.projectId}/tasks/${task.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                                  {task.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{task.project?.name || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ''}`}>{task.priority}</span>
                              </td>
                              <td className="px-4 py-3">
                                {task.dueDate ? (
                                  <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                ) : <span className="text-xs text-muted-foreground">-</span>}
                              </td>
                              <td className="px-4 py-3">
                                {task.assignments && task.assignments.length > 0 ? (
                                  <div className="flex -space-x-1">
                                    {task.assignments.slice(0, 3).map((a: any) => (
                                      <div key={a.user.id} className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card" title={a.user.name || a.user.email}>
                                        <span className="text-[10px] font-bold text-primary">{(a.user.name?.[0] || a.user.email[0]).toUpperCase()}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : <span className="text-xs text-muted-foreground">-</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex gap-1 justify-end">
                                  {task.status !== 'DONE' && (
                                    <button onClick={() => handleStatusUpdate(task.id, 'DONE')} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">Done</button>
                                  )}
                                  {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                                    <button onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')} className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors">Start</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">Create your first task to get started</p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateTaskForm({ projects, onCreated }: { projects: any[]; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<Member[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const assignRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [createTask, { isLoading }] = useCreateTaskMutation();

  // Get org ID from selected project
  const selectedProject = projects.find((p: any) => p.id === projectId);
  const orgId = selectedProject?.space?.organizationId || '';
  const { data: members = [] } = useGetOrgMembersQuery(orgId, { skip: !orgId });
  const { data: issueTypes = [] } = useGetOrgIssueTypesQuery(orgId, { skip: !orgId });

  // Reset assignees and issue type when project changes
  useEffect(() => {
    setAssignedUsers([]);
    setAssignSearch('');
    setIssueTypeId('');
  }, [projectId]);

  const filteredMembers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((u) => u.id));
    const search = assignSearch.replace(/^@/, '').toLowerCase();
    return members.filter(
      (m: Member) => !assignedIds.has(m.id) && (m.name?.toLowerCase().includes(search) || m.email.toLowerCase().includes(search))
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
      const newMembers = members.filter((m: Member) => !assignedIds.has(m.id));
      setAssignedUsers([...assignedUsers, ...newMembers]);
      setAssignSearch('');
      setShowDropdown(false);
      return;
    }
    setShowDropdown(value.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        title,
        description: description || undefined,
        projectId,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
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
        <Label>Project</Label>
        <Select value={projectId} onValueChange={setProjectId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} {p.space?.organization?.name ? `(${p.space.organization.name})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." rows={3} disabled={isLoading} />
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
      {projectId && issueTypes.length > 0 && (
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

      {/* Assign Members */}
      {projectId && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Assign
          </Label>

          {assignedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assignedUsers.map((m) => (
                <Badge key={m.id} variant="secondary" className="gap-1 pr-1 text-xs">
                  {m.name || m.email.split('@')[0]}
                  <button type="button" onClick={() => setAssignedUsers((prev) => prev.filter((u) => u.id !== m.id))} className="ml-0.5 p-0.5 rounded-full hover:bg-muted">
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
                  filteredMembers.map((m: Member) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setAssignedUsers((prev) => [...prev, m]); setAssignSearch(''); setShowDropdown(false); assignRef.current?.focus(); }}
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
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !projectId || !title.trim()}>
        {isLoading ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  );
}
