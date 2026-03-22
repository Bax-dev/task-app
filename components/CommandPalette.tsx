'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Settings,
  Building2,
  Users,
  FileText,
  Activity,
  CalendarDays,
  BarChart3,
  Star,
  Kanban,
  Tags,
  Repeat2,
  Zap,
  Plug,
  Filter,
  GaugeCircle,
  Layers,
  Search,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useGetUserTasksQuery, useGetProjectsQuery, useGetOrganizationsQuery } from '@/store/api';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: tasks = [] } = useGetUserTasksQuery(undefined, { skip: !open });
  const { data: projects = [] } = useGetProjectsQuery(undefined, { skip: !open });
  const { data: organizations = [] } = useGetOrganizationsQuery(undefined, { skip: !open });

  // Keyboard shortcut: Cmd/Ctrl + K to toggle, Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const navigate = useCallback((path: string) => {
    onOpenChange(false);
    router.push(path);
  }, [router, onOpenChange]);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // Navigation
      { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, action: () => navigate('/dashboard'), category: 'Navigation' },
      { id: 'nav-tasks', label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" />, action: () => navigate('/tasks'), category: 'Navigation' },
      { id: 'nav-projects', label: 'Projects', icon: <FolderOpen className="w-4 h-4" />, action: () => navigate('/projects'), category: 'Navigation' },
      { id: 'nav-boards', label: 'Boards', icon: <Kanban className="w-4 h-4" />, action: () => navigate('/boards'), category: 'Navigation' },
      { id: 'nav-sprints', label: 'Sprints', icon: <Repeat2 className="w-4 h-4" />, action: () => navigate('/sprints'), category: 'Navigation' },
      { id: 'nav-calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" />, action: () => navigate('/calendar'), category: 'Navigation' },
      { id: 'nav-notes', label: 'Notes', icon: <FileText className="w-4 h-4" />, action: () => navigate('/notes'), category: 'Navigation' },
      { id: 'nav-favorites', label: 'Quick Access', icon: <Star className="w-4 h-4" />, action: () => navigate('/favorites'), category: 'Navigation' },
      { id: 'nav-orgs', label: 'Organizations', icon: <Building2 className="w-4 h-4" />, action: () => navigate('/organizations'), category: 'Navigation' },
      { id: 'nav-team', label: 'Team', icon: <Users className="w-4 h-4" />, action: () => navigate('/team'), category: 'Navigation' },
      { id: 'nav-labels', label: 'Labels', icon: <Tags className="w-4 h-4" />, action: () => navigate('/labels'), category: 'Navigation' },
      { id: 'nav-issue-types', label: 'Issue Types', icon: <Layers className="w-4 h-4" />, action: () => navigate('/issue-types'), category: 'Navigation' },
      { id: 'nav-workflows', label: 'Workflows', icon: <GaugeCircle className="w-4 h-4" />, action: () => navigate('/workflows'), category: 'Navigation' },
      { id: 'nav-automations', label: 'Automations', icon: <Zap className="w-4 h-4" />, action: () => navigate('/automations'), category: 'Navigation' },
      { id: 'nav-integrations', label: 'Integrations', icon: <Plug className="w-4 h-4" />, action: () => navigate('/integrations'), category: 'Navigation' },
      { id: 'nav-reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, action: () => navigate('/reports'), category: 'Navigation' },
      { id: 'nav-filters', label: 'Saved Filters', icon: <Filter className="w-4 h-4" />, action: () => navigate('/saved-filters'), category: 'Navigation' },
      { id: 'nav-logs', label: 'Audit Logs', icon: <Activity className="w-4 h-4" />, action: () => navigate('/activity-logs'), category: 'Navigation' },
      { id: 'nav-notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, action: () => navigate('/notifications'), category: 'Navigation' },
      { id: 'nav-settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, action: () => navigate('/settings'), category: 'Navigation' },
    ];

    // Add tasks as searchable items
    tasks.slice(0, 20).forEach((task: any) => {
      items.push({
        id: `task-${task.id}`,
        label: task.title,
        description: task.project?.name || '',
        icon: <CheckSquare className="w-4 h-4" />,
        action: () => navigate(`/projects/${task.projectId}/tasks/${task.id}`),
        category: 'Tasks',
      });
    });

    // Add projects
    projects.slice(0, 15).forEach((project: any) => {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        description: project.space?.name || '',
        icon: <FolderOpen className="w-4 h-4" />,
        action: () => navigate(`/projects/${project.id}`),
        category: 'Projects',
      });
    });

    // Add organizations
    organizations.forEach((org: any) => {
      items.push({
        id: `org-${org.id}`,
        label: org.name,
        icon: <Building2 className="w-4 h-4" />,
        action: () => navigate(`/organizations/${org.id}`),
        category: 'Organizations',
      });
    });

    return items;
  }, [tasks, projects, organizations, navigate]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 10); // Show navigation by default
    const q = query.toLowerCase();
    return commands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const seen = new Set<string>();
    filtered.forEach((item) => {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({ category: item.category, items: [] });
      }
      groups.find((g) => g.category === item.category)!.items.push(item);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => onOpenChange(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div className="relative flex items-start justify-center pt-[15vh]">
        <div
          className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks, projects, pages..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border text-[10px] text-muted-foreground font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-auto py-2">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {group.category}
                  </div>
                  {group.items.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <span className="flex-shrink-0 text-muted-foreground">{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {item.description}
                          </span>
                        )}
                        {idx === selectedIndex && (
                          <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border font-mono">&uarr;&darr;</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border font-mono">&crarr;</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border font-mono">ESC</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
