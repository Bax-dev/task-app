'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  Filter,
  FolderOpen,
  Kanban,
  LayoutDashboard,
  Plus,
  Repeat2,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useGetOrganizationsQuery, useGetProjectsQuery, useGetUserTasksQuery } from '@/store/api';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandItemShape {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { data: tasks = [] } = useGetUserTasksQuery(undefined, { skip: !open });
  const { data: projects = [] } = useGetProjectsQuery(undefined, { skip: !open });
  const { data: organizations = [] } = useGetOrganizationsQuery(undefined, { skip: !open });

  function navigate(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  const commands = useMemo<CommandItemShape[]>(() => {
    const items: CommandItemShape[] = [
      {
        id: 'new-task',
        label: 'Create task',
        description: 'Jump to the task workspace and use quick add',
        icon: <Plus className="h-4 w-4" />,
        action: () => navigate('/tasks'),
        category: 'Quick Actions',
        keywords: ['new', 'task', 'create'],
      },
      {
        id: 'today-work',
        label: 'Review my tasks',
        description: 'Open your personal task view',
        icon: <CheckSquare className="h-4 w-4" />,
        action: () => navigate('/tasks'),
        category: 'Quick Actions',
        keywords: ['today', 'my work', 'assigned'],
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Return to your overview',
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => navigate('/dashboard'),
        category: 'Navigation',
        shortcut: 'Home',
      },
      {
        id: 'projects',
        label: 'Projects',
        description: 'Browse all projects',
        icon: <FolderOpen className="h-4 w-4" />,
        action: () => navigate('/projects'),
        category: 'Navigation',
      },
      {
        id: 'boards',
        label: 'Boards',
        description: 'See work by column',
        icon: <Kanban className="h-4 w-4" />,
        action: () => navigate('/boards'),
        category: 'Navigation',
      },
      {
        id: 'calendar',
        label: 'Calendar',
        description: 'See deadlines and scheduled work',
        icon: <CalendarDays className="h-4 w-4" />,
        action: () => navigate('/calendar'),
        category: 'Navigation',
      },
      {
        id: 'notes',
        label: 'Notes',
        description: 'Open your private notes',
        icon: <FileText className="h-4 w-4" />,
        action: () => navigate('/notes'),
        category: 'Navigation',
      },
      {
        id: 'favorites',
        label: 'Quick Access',
        description: 'Open your starred areas',
        icon: <Star className="h-4 w-4" />,
        action: () => navigate('/favorites'),
        category: 'Navigation',
      },
      {
        id: 'team',
        label: 'Team',
        description: 'Manage members and ownership',
        icon: <Users className="h-4 w-4" />,
        action: () => navigate('/team'),
        category: 'Navigation',
      },
      {
        id: 'orgs',
        label: 'Organizations',
        description: 'View organizations and spaces',
        icon: <Building2 className="h-4 w-4" />,
        action: () => navigate('/organizations'),
        category: 'Navigation',
      },
      {
        id: 'sprints',
        label: 'Sprints',
        description: 'Plan and review sprint work',
        icon: <Repeat2 className="h-4 w-4" />,
        action: () => navigate('/sprints'),
        category: 'Navigation',
      },
      {
        id: 'filters',
        label: 'Saved Filters',
        description: 'Reuse common task views',
        icon: <Filter className="h-4 w-4" />,
        action: () => navigate('/saved-filters'),
        category: 'Navigation',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Check recent updates',
        icon: <Bell className="h-4 w-4" />,
        action: () => navigate('/notifications'),
        category: 'Navigation',
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Manage your account',
        icon: <Settings className="h-4 w-4" />,
        action: () => navigate('/settings'),
        category: 'Navigation',
      },
      {
        id: 'ai',
        label: 'AI workspace',
        description: 'Open the in-app assistant from the header',
        icon: <Sparkles className="h-4 w-4" />,
        action: () => onOpenChange(false),
        category: 'Tips',
      },
      {
        id: 'search-tip',
        label: 'Tip: search tasks by title or project',
        description: 'Type a project name or task title below',
        icon: <Search className="h-4 w-4" />,
        action: () => undefined,
        category: 'Tips',
      },
    ];

    tasks.slice(0, 20).forEach((task: any) => {
      items.push({
        id: `task-${task.id}`,
        label: task.title,
        description: task.project?.name || 'Task',
        icon: <CheckSquare className="h-4 w-4" />,
        action: () => navigate(`/projects/${task.projectId}/tasks/${task.id}`),
        category: 'Tasks',
        keywords: [task.status, task.priority, task.project?.name].filter(Boolean),
      });
    });

    projects.slice(0, 15).forEach((project: any) => {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        description: project.space?.name || 'Project',
        icon: <FolderOpen className="h-4 w-4" />,
        action: () => navigate(`/projects/${project.id}`),
        category: 'Projects',
      });
    });

    organizations.forEach((org: any) => {
      items.push({
        id: `org-${org.id}`,
        label: org.name,
        description: 'Organization',
        icon: <Building2 className="h-4 w-4" />,
        action: () => navigate(`/organizations/${org.id}`),
        category: 'Organizations',
      });
    });

    return items;
  }, [tasks, projects, organizations, router, onOpenChange]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItemShape[]>();
    commands.forEach((item) => {
      const existing = map.get(item.category) || [];
      existing.push(item);
      map.set(item.category, existing);
    });
    return Array.from(map.entries());
  }, [commands]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search TaskFlow"
      description="Jump to pages, tasks, projects, and common actions."
      className="max-w-2xl"
    >
      <CommandInput placeholder="Search tasks, projects, pages, and quick actions..." />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>No results found.</CommandEmpty>
        {grouped.map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem key={item.id} value={[item.label, item.description, ...(item.keywords || [])].filter(Boolean).join(' ')} onSelect={item.action}>
                {item.icon}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.description && (
                    <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                  )}
                </div>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
