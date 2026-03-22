'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Tags, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useGetOrgLabelsQuery, useAddTaskLabelMutation, useRemoveTaskLabelMutation } from '@/store/api';

interface TaskLabelPickerProps {
  taskId: string;
  orgId: string;
  taskLabels: Array<{ id: string; labelId: string; label?: { id: string; name: string; color: string } }>;
  readOnly?: boolean;
}

export default function TaskLabelPicker({ taskId, orgId, taskLabels, readOnly = false }: TaskLabelPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allLabels = [] } = useGetOrgLabelsQuery(orgId, { skip: !orgId });
  const [addTaskLabel] = useAddTaskLabelMutation();
  const [removeTaskLabel] = useRemoveTaskLabelMutation();

  const assignedLabelIds = useMemo(
    () => new Set(taskLabels.map((tl) => tl.labelId || tl.label?.id)),
    [taskLabels]
  );

  const availableLabels = useMemo(
    () => allLabels.filter((l: any) => !assignedLabelIds.has(l.id) && l.name.toLowerCase().includes(search.toLowerCase())),
    [allLabels, assignedLabelIds, search]
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (showPicker) inputRef.current?.focus();
  }, [showPicker]);

  const handleAdd = async (labelId: string) => {
    try {
      await addTaskLabel({ taskId, labelId }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add label');
    }
  };

  const handleRemove = async (labelId: string) => {
    try {
      await removeTaskLabel({ taskId, labelId }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove label');
    }
  };

  return (
    <div className="space-y-3">
      {/* Current labels */}
      {taskLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {taskLabels.map((tl) => {
            const label = tl.label;
            if (!label) return null;
            return (
              <span
                key={tl.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: label.color || '#64748b' }}
              >
                {label.name}
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(label.id)}
                    className="hover:opacity-75 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No labels</p>
      )}

      {/* Add label button + picker */}
      {!readOnly && (
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add label
          </button>

          {showPicker && (
            <div className="absolute top-8 left-0 z-20 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search labels..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-48 overflow-auto py-1">
                {availableLabels.length > 0 ? (
                  availableLabels.map((label: any) => (
                    <button
                      key={label.id}
                      onClick={() => { handleAdd(label.id); setSearch(''); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color || '#64748b' }}
                      />
                      <span className="truncate">{label.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                    {allLabels.length === 0 ? 'No labels created yet' : 'No matching labels'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
