'use client';

import { useState, useMemo } from 'react';
import {
  Tag, Search, Pencil, Trash2, Hash, BarChart3, AlertCircle, ListTodo, Plus, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetUserTasksQuery } from '@/store/api';

interface LabelReadProps {
  labels: any[];
  isLoading: boolean;
  selectedLabelId: string | null;
  onSelectLabel: (id: string | null) => void;
  onEditLabel: (label: any) => void;
  onDeleteLabel: (label: any) => void;
  isGuest: boolean;
  onCreateLabel?: () => void;
}

export default function LabelRead({
  labels,
  isLoading,
  selectedLabelId,
  onSelectLabel,
  onEditLabel,
  onDeleteLabel,
  isGuest,
  onCreateLabel,
}: LabelReadProps) {
  const [search, setSearch] = useState('');
  const { data: tasks = [] } = useGetUserTasksQuery();

  // Analytics
  const analytics = useMemo(() => {
    if (!labels.length) return { total: 0, maxCount: 0, mostUsed: null as any, unusedCount: 0 };

    const maxCount = Math.max(...labels.map((l: any) => l._count?.taskLabels ?? 0));
    const mostUsed = labels.reduce((best: any, l: any) =>
      (l._count?.taskLabels ?? 0) > (best?._count?.taskLabels ?? 0) ? l : best
    , labels[0]);
    const unusedCount = labels.filter((l: any) => (l._count?.taskLabels ?? 0) === 0).length;

    return { total: labels.length, maxCount, mostUsed, unusedCount };
  }, [labels]);

  // Filtered labels by search
  const filteredLabels = useMemo(() =>
    labels.filter((l: any) => l.name.toLowerCase().includes(search.toLowerCase())),
  [labels, search]);

  // Selected label
  const selectedLabel = useMemo(() =>
    labels.find((l: any) => l.id === selectedLabelId) ?? null,
  [labels, selectedLabelId]);

  // Tasks filtered by selected label
  const filteredTasks = useMemo(() => {
    if (!selectedLabel) return [];
    return tasks.filter((t: any) =>
      t.labels?.some((tl: any) => tl.labelId === selectedLabelId || tl.id === selectedLabelId) ||
      t.taskLabels?.some((tl: any) => tl.labelId === selectedLabelId || tl.label?.id === selectedLabelId)
    );
  }, [tasks, selectedLabelId, selectedLabel]);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'LOW': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE': case 'COMPLETED': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'IN_PROGRESS': case 'IN PROGRESS': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'TODO': case 'OPEN': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      case 'REVIEW': case 'IN_REVIEW': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No labels yet</h3>
        <p className="text-muted-foreground mb-4">Create your first label to categorize tasks</p>
        {!isGuest && onCreateLabel && (
          <Button onClick={onCreateLabel} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Label
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{analytics.total}</p>
            <p className="text-xs text-muted-foreground">Total Labels</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground truncate">
                {analytics.mostUsed?._count?.taskLabels ?? 0}
              </p>
              {analytics.mostUsed && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white truncate max-w-[120px]"
                  style={{ backgroundColor: analytics.mostUsed.color || '#64748b' }}
                >
                  {analytics.mostUsed.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Most Used Label</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{analytics.unusedCount}</p>
            <p className="text-xs text-muted-foreground">Unused Labels</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search labels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Label Grid */}
      {filteredLabels.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No labels match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLabels.map((label: any) => {
            const count = label._count?.taskLabels ?? 0;
            const barWidth = analytics.maxCount > 0 ? (count / analytics.maxCount) * 100 : 0;
            const isSelected = selectedLabelId === label.id;

            return (
              <div key={label.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelectLabel(isSelected ? null : label.id)}
                  className={`w-full text-left bg-card border rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background"
                      style={{
                        backgroundColor: label.color || '#64748b',
                        borderColor: label.color || '#64748b',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{label.name}</h3>
                    </div>
                  </div>

                  {/* Usage count */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{count} {count === 1 ? 'task' : 'tasks'}</span>
                    {analytics.maxCount > 0 && (
                      <span className="font-mono">{Math.round(barWidth)}%</span>
                    )}
                  </div>

                  {/* Usage bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: label.color || '#64748b',
                      }}
                    />
                  </div>
                </button>

                {/* Edit / Delete buttons */}
                {!isGuest && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); onEditLabel(label); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDeleteLabel(label); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task View Section */}
      <div className="border-t border-border pt-6">
        {selectedLabel ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedLabel.color || '#64748b' }}
              />
              <h2 className="text-lg font-semibold text-foreground">
                Tasks with &quot;{selectedLabel.name}&quot;
              </h2>
              <span className="text-sm text-muted-foreground">
                ({selectedLabel._count?.taskLabels ?? 0} total)
              </span>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="space-y-2">
                {filteredTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {task.taskNumber && (
                            <span className="text-xs font-mono text-muted-foreground">
                              #{task.taskNumber}
                            </span>
                          )}
                          <h3 className="font-medium text-foreground truncate">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(task.status)}`}>
                            {task.status?.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.project?.name && (
                            <span className="text-xs text-muted-foreground">
                              {task.project.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.assignments && task.assignments.length > 0 && (
                        <div className="flex -space-x-1 shrink-0">
                          {task.assignments.slice(0, 3).map((a: any, i: number) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-medium text-primary"
                              title={a.user?.name || a.user?.email}
                            >
                              {(a.user?.name || a.user?.email || '?').charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {task.assignments.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                              +{task.assignments.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                <ListTodo className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {(selectedLabel._count?.taskLabels ?? 0) > 0
                    ? `This label is used on ${selectedLabel._count?.taskLabels} task(s), but they are not in your current task list.`
                    : 'No tasks are using this label yet.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Select a label to view associated tasks
            </p>
          </div>
        )}
      </div>
    </>
  );
}
