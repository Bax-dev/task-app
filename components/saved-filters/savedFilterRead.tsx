'use client';

import { useState, useMemo } from 'react';
import {
  Filter, Loader2, Search, Globe, Lock,
  RotateCcw, CheckCircle2, Save, Pencil, Trash2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetUserTasksQuery } from '@/store/api';
import type { Task } from '@/types/task';

// ─── Constants ───

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const DUE_DATE_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'no_date', label: 'No Date' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  TODO: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  DONE: '#22c55e',
  REJECTED: '#ef4444',
  CANCELLED: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// ─── Helpers ───

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Badge Components ───

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#94a3b8';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || '#94a3b8';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

// ─── Filter Pill ───

function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
      style={
        active
          ? {
              backgroundColor: color ? `${color}15` : 'hsl(var(--primary) / 0.1)',
              borderColor: color ? `${color}50` : 'hsl(var(--primary) / 0.3)',
              color: color || 'hsl(var(--primary))',
            }
          : undefined
      }
      {...(!active && {
        className:
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all border-border text-muted-foreground hover:bg-muted/50',
      })}
    >
      {active && <CheckCircle2 className="w-3 h-3" />}
      {label}
    </button>
  );
}

// ─── Main Component ───

interface SavedFilterReadProps {
  filters: any[];
  isLoading: boolean;
  selectedFilterId: string | null;
  onSelectFilter: (id: string | null) => void;
  onEditFilter: (filter: any) => void;
  onDeleteFilter: (filter: any) => void;
  onSaveFilter: (query: { status: string[]; priority: string[]; dueDate: string }) => void;
  isGuest: boolean;
}

export default function SavedFilterRead({
  filters,
  isLoading,
  selectedFilterId,
  onSelectFilter,
  onEditFilter,
  onDeleteFilter,
  onSaveFilter,
  isGuest,
}: SavedFilterReadProps) {
  // Filter state
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterDueDate, setFilterDueDate] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');

  const { data: allTasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();

  // Toggle helpers
  const toggleStatus = (s: string) => {
    onSelectFilter(null);
    setFilterStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const togglePriority = (p: string) => {
    onSelectFilter(null);
    setFilterPriority((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleDueDate = (d: string) => {
    onSelectFilter(null);
    setFilterDueDate((prev) => (prev === d ? '' : d));
  };

  const clearAll = () => {
    setFilterStatus([]);
    setFilterPriority([]);
    setFilterDueDate('');
    onSelectFilter(null);
  };

  const hasActiveFilters = filterStatus.length > 0 || filterPriority.length > 0 || filterDueDate !== '';

  // Apply saved filter
  const applySavedFilter = (filter: any) => {
    const q = filter.query || {};
    setFilterStatus(q.status || []);
    setFilterPriority(q.priority || []);
    setFilterDueDate(q.dueDate || '');
    onSelectFilter(filter.id);
  };

  // Filter tasks client-side
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task: Task) => {
      if (filterStatus.length > 0 && !filterStatus.includes(task.status)) return false;
      if (filterPriority.length > 0 && !filterPriority.includes(task.priority)) return false;

      if (filterDueDate === 'overdue') {
        if (!task.dueDate || new Date(task.dueDate) >= new Date()) return false;
      }
      if (filterDueDate === 'today') {
        if (!task.dueDate || !isToday(new Date(task.dueDate))) return false;
      }
      if (filterDueDate === 'this_week') {
        if (!task.dueDate || !isThisWeek(new Date(task.dueDate))) return false;
      }
      if (filterDueDate === 'no_date') {
        if (task.dueDate) return false;
      }

      return true;
    });
  }, [allTasks, filterStatus, filterPriority, filterDueDate]);

  // Filtered saved-filter list
  const displayedFilters = filters.filter((f: any) =>
    f.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const handleSaveClick = () => {
    onSaveFilter({ status: filterStatus, priority: filterPriority, dueDate: filterDueDate });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      {/* ─── Left Sidebar: Saved Filters ─── */}
      <div className="lg:w-72 xl:w-80 shrink-0">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Saved Filters</h2>
            {!isGuest && hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleSaveClick}>
                <Save className="w-3.5 h-3.5" />
                Save
              </Button>
            )}
          </div>

          {/* Search filters */}
          {filters.length > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Filter list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : displayedFilters.length > 0 ? (
              <div className="divide-y divide-border">
                {displayedFilters.map((filter: any) => (
                  <div
                    key={filter.id}
                    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedFilterId === filter.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => applySavedFilter(filter)}
                  >
                    <Filter className={`w-4 h-4 shrink-0 ${selectedFilterId === filter.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${selectedFilterId === filter.id ? 'text-primary' : 'text-foreground'}`}>
                        {filter.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {filter.shared ? (
                          <Globe className="w-3 h-3 text-primary" />
                        ) : (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {filter.createdBy?.name || filter.createdBy?.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isGuest && selectedFilterId === filter.id && hasActiveFilters && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditFilter(filter); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit filter"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isGuest && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteFilter(filter); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${selectedFilterId === filter.id ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                ))}
              </div>
            ) : filters.length > 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">No filters match &quot;{filterSearch}&quot;</p>
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No saved filters yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Build a query below and save it</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Area: Query Builder + Preview ─── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Query Builder */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Query Builder</h2>
              {hasActiveFilters && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {filterStatus.length + filterPriority.length + (filterDueDate ? 1 : 0)} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={clearAll}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear All
                </Button>
              )}
              {!isGuest && hasActiveFilters && (
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleSaveClick}>
                  <Save className="w-3.5 h-3.5" />
                  Save Filter
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Status Row */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <FilterPill
                    key={s}
                    label={STATUS_LABELS[s]}
                    active={filterStatus.includes(s)}
                    color={STATUS_COLORS[s]}
                    onClick={() => toggleStatus(s)}
                  />
                ))}
              </div>
            </div>

            {/* Priority Row */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <FilterPill
                    key={p}
                    label={PRIORITY_LABELS[p]}
                    active={filterPriority.includes(p)}
                    color={PRIORITY_COLORS[p]}
                    onClick={() => togglePriority(p)}
                  />
                ))}
              </div>
            </div>

            {/* Due Date Row */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Due Date</label>
              <div className="flex flex-wrap gap-2">
                {DUE_DATE_OPTIONS.map((d) => (
                  <FilterPill
                    key={d.value}
                    label={d.label}
                    active={filterDueDate === d.value}
                    onClick={() => toggleDueDate(d.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-card border border-border rounded-lg flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Live Preview</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredTasks.length}</span> of <span className="font-semibold text-foreground">{allTasks.length}</span> tasks
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No tasks match the current filters</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters ? 'Try adjusting your filter criteria' : 'Select filters above to narrow results'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[120px]">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[100px]">Priority</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[160px] hidden md:table-cell">Project</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[120px] hidden sm:table-cell">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.map((task: Task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {task.taskNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">#{task.taskNumber}</span>
                          )}
                          <span className="font-medium text-foreground truncate">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground truncate block">
                          {task.project?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span
                          className={`text-xs ${
                            task.dueDate && new Date(task.dueDate) < new Date()
                              ? 'text-destructive font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
