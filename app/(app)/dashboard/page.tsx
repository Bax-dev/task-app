'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderOpen,
  Users,
  Zap,
  Loader2,
  CheckSquare,
  CalendarDays,
  FileText,
  ArrowRight,
  BarChart3,
  Star,
  Activity,
  Pencil,
  Check,
  X,
  Clock,
  Layers,
  GripVertical,
} from 'lucide-react';
import { useGetOrganizationsQuery, useGetUserTasksQuery, useGetProjectsQuery, useGetMeQuery, useCreateSpaceMutation } from '@/store/api';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectVisibleModuleCards, renameModuleCard, reorderModuleCards, type ModuleCard } from '@/store/slices/preferencesSlice';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Star,
  Users,
  Activity,
  FolderOpen,
};

interface DraggableCardProps {
  card: { id: string; name: string; href: string; icon: string };
  index: number;
  dragIndex: number | null;
  overIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function DraggableModuleCard({ card, index, dragIndex, overIndex, onDragStart, onDragOver, onDragEnd, onDrop }: DraggableCardProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICON_MAP[card.icon] || CheckSquare;
  const isDragging = dragIndex === index;
  const isOver = overIndex === index;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== card.name) {
      dispatch(renameModuleCard({ id: card.id, name: trimmed }));
    } else {
      setEditValue(card.name);
    }
    setEditing(false);
  };

  const cancel = () => {
    setEditValue(card.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card border-2 border-primary/30 rounded-lg p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={save}
          className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-foreground min-w-0"
          maxLength={20}
        />
        <button onClick={save} className="text-green-600 hover:text-green-700 flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative transition-all duration-200 ${isDragging ? 'opacity-40 scale-95' : ''} ${isOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <Link href={card.href}>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate flex-1">
            {card.name}
          </span>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
        className="absolute top-1.5 right-7 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
        title="Rename"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

export default function DashboardPage() {
  const { data: user } = useGetMeQuery();
  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const { data: projects = [], error: projectsError } = useGetProjectsQuery();
  const allModuleCards = useAppSelector(selectVisibleModuleCards);
  const dispatch = useAppDispatch();
  const [localCards, setLocalCards] = useState<ModuleCard[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalCards(allModuleCards);
  }, [allModuleCards]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...localCards];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(overIndex, 0, moved);
    setLocalCards(updated);
    dispatch(reorderModuleCards(updated));
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, localCards, dispatch]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');
  const [spaceOrgId, setSpaceOrgId] = useState('');
  const [createSpace, { isLoading: isCreatingSpace }] = useCreateSpaceMutation();

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || !spaceOrgId) return;
    try {
      await createSpace({ name: spaceName.trim(), color: spaceColor, organizationId: spaceOrgId }).unwrap();
      toast.success('Space created!');
      setSpaceDialogOpen(false);
      setSpaceName('');
      setSpaceColor('#7c3aed');
      setSpaceOrgId('');
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Failed to create space');
    }
  };

  if (orgsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentTasks = tasks.slice(0, 5);
  const inProgressCount = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t: any) => t.status === 'DONE').length;
  const todoCount = tasks.filter((t: any) => t.status === 'TODO').length;

  // Tasks due soon (next 3 days)
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dueSoonCount = tasks.filter((t: any) => {
    if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= threeDays;
  }).length;

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {getContextualSubtitle(inProgressCount, dueSoonCount, todoCount)}
          </p>
        </div>
        <div className="flex gap-2">
          {organizations.length > 0 && projects.length > 0 && (
            <Link href={`/projects/${projects[0]?.id}/tasks/new`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Task
              </Button>
            </Link>
          )}
          {organizations.length > 0 && (
            <Dialog open={spaceDialogOpen} onOpenChange={setSpaceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  New Space
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
                <form onSubmit={handleCreateSpace}>
                  <div className="px-5 pt-5 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Space</span>
                    </div>
                  </div>
                  <input
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="Space Name"
                    className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
                    required
                    autoFocus
                  />
                  <div className="border-t border-border" />
                  <div className="px-5 py-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
                      <Select value={spaceOrgId} onValueChange={setSpaceOrgId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org: any) => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {SPACE_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSpaceColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${spaceColor === c ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ring-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border" />
                  <div className="px-5 py-3 flex items-center justify-end">
                    <Button type="submit" disabled={isCreatingSpace || !spaceName.trim() || !spaceOrgId} size="sm" className="gap-1.5 px-5">
                      {isCreatingSpace ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {isCreatingSpace ? 'Creating...' : 'Create Space'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Link href="/organizations/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Org
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link href="/organizations">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <Users className="w-5 h-5 text-primary/40 mb-2" />
            <p className="text-2xl font-bold text-foreground">{organizations.length}</p>
            <p className="text-xs text-muted-foreground">Organizations</p>
          </div>
        </Link>
        <Link href="/projects">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <FolderOpen className="w-5 h-5 text-primary/40 mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {projectsError ? <span className="text-destructive text-sm">--</span> : projects.length}
            </p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
        </Link>
        <Link href="/tasks">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <Zap className="w-5 h-5 text-amber-500/40 mb-2" />
            <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </Link>
        <Link href="/tasks">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <CheckSquare className="w-5 h-5 text-green-500/40 mb-2" />
            <p className="text-2xl font-bold text-foreground">{doneCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </Link>
      </div>

      {/* Module Cards - Drag & Drop */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
          <span className="text-[10px] text-muted-foreground/60">Drag to reorder</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {localCards.map((card, i) => (
            <DraggableModuleCard
              key={card.id}
              card={card}
              index={i}
              dragIndex={dragIndex}
              overIndex={overIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Due Soon Alert */}
      {dueSoonCount > 0 && (
        <Link href="/calendar">
          <div className="mb-6 bg-amber-500/5 border border-amber-200 dark:border-amber-900 rounded-lg p-3 flex items-center gap-3 hover:bg-amber-500/10 transition-colors">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{dueSoonCount} task{dueSoonCount > 1 ? 's' : ''}</span>
              {' '}due in the next 3 days
            </p>
            <ArrowRight className="w-4 h-4 text-amber-600 ml-auto flex-shrink-0" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          {recentTasks.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">Recent Tasks</h2>
                <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {recentTasks.map((task: any) => (
                  <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.status === 'DONE' ? 'bg-green-500' :
                        task.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.project?.name || '-'}</p>
                      </div>
                      {task.dueDate && (
                        <span className={`text-[10px] flex-shrink-0 ${
                          new Date(task.dueDate) < now && task.status !== 'DONE'
                            ? 'text-red-500 font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                        task.priority === 'URGENT' ? 'bg-red-500/10 text-red-600' :
                        task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600' :
                        task.priority === 'LOW' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Welcome to TaskFlow</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Get started by creating your first organization. Then add spaces, projects, and tasks to stay organized.
                </p>
                <div className="space-y-2">
                  <Link href="/organizations/new" className="block">
                    <Button className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Create Organization
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 text-left space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How it works</p>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <p className="text-sm text-muted-foreground">Create an <span className="text-foreground font-medium">Organization</span> for your team</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <p className="text-sm text-muted-foreground">Add <span className="text-foreground font-medium">Spaces</span> to group related work</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <p className="text-sm text-muted-foreground">Create <span className="text-foreground font-medium">Projects</span> and add <span className="text-foreground font-medium">Tasks</span></p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg text-center py-10">
              <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">No tasks yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a project first, then add tasks to it</p>
              {projects.length > 0 ? (
                <Link href={`/projects/${projects[0]?.id}/tasks/new`}>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Create Task
                  </Button>
                </Link>
              ) : (
                <Link href="/projects">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Go to Projects
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Organizations sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Organizations</h2>
            <Link href="/organizations" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {organizations.length > 0 ? (
            <div className="space-y-2">
              {organizations.slice(0, 5).map((org: any) => (
                <Link key={org.id} href={`/organizations/${org.id}`} className="group block">
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {org._count?.spaces || 0} spaces &middot; {org._count?.memberships || 0} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">No organizations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getContextualSubtitle(inProgress: number, dueSoon: number, todo: number): string {
  if (inProgress > 0 && dueSoon > 0) {
    return `${inProgress} task${inProgress > 1 ? 's' : ''} in progress, ${dueSoon} due soon`;
  }
  if (inProgress > 0) {
    return `You have ${inProgress} task${inProgress > 1 ? 's' : ''} in progress`;
  }
  if (todo > 0) {
    return `${todo} task${todo > 1 ? 's' : ''} waiting for you`;
  }
  return 'Your workspace at a glance';
}
