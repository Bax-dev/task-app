'use client';

import { useState } from 'react';
import {
  Zap,
  Loader2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowDown,
  Sparkles,
  Activity,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useUpdateAutomationMutation } from '@/store/api';

// ---------------------------------------------------------------------------
// Trigger & Action display config
// ---------------------------------------------------------------------------

const TRIGGERS: Record<string, { label: string; icon: string; color: string }> = {
  TASK_CREATED: { label: 'Task Created', icon: '\u{1F4CB}', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  TASK_UPDATED: { label: 'Task Updated', icon: '\u{270F}\uFE0F', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  TASK_STATUS_CHANGED: { label: 'Status Changed', icon: '\u{1F504}', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  TASK_ASSIGNED: { label: 'Task Assigned', icon: '\u{1F464}', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  TASK_COMMENT_ADDED: { label: 'Comment Added', icon: '\u{1F4AC}', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20' },
  SPRINT_STARTED: { label: 'Sprint Started', icon: '\u{1F3C3}', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' },
  SPRINT_COMPLETED: { label: 'Sprint Completed', icon: '\u{1F3C1}', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
};

const ACTIONS: Record<string, { label: string; icon: string; color: string }> = {
  ASSIGN_USER: { label: 'Assign User', icon: '\u{1F464}', color: 'bg-violet-500/10 text-violet-700 border-violet-500/20' },
  CHANGE_STATUS: { label: 'Change Status', icon: '\u{1F504}', color: 'bg-sky-500/10 text-sky-700 border-sky-500/20' },
  ADD_LABEL: { label: 'Add Label', icon: '\u{1F3F7}\uFE0F', color: 'bg-pink-500/10 text-pink-700 border-pink-500/20' },
  ADD_COMMENT: { label: 'Add Comment', icon: '\u{1F4DD}', color: 'bg-teal-500/10 text-teal-700 border-teal-500/20' },
  SEND_NOTIFICATION: { label: 'Send Notification', icon: '\u{1F4E7}', color: 'bg-rose-500/10 text-rose-700 border-rose-500/20' },
  MOVE_TO_SPRINT: { label: 'Move to Sprint', icon: '\u{1F680}', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
};

function getTrigger(value: string) {
  return TRIGGERS[value] ?? { label: value, icon: '\u26A1', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
}

function getAction(value: string) {
  return ACTIONS[value] ?? { label: value, icon: '\u2728', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | undefined) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return new Date(dateStr).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AutomationReadProps {
  automations: any[];
  isLoading: boolean;
  isAdmin: boolean;
  onEditAutomation: (automation: any) => void;
  onDeleteAutomation: (automation: any) => void;
}

export default function AutomationRead({
  automations,
  isLoading,
  isAdmin,
  onEditAutomation,
  onDeleteAutomation,
}: AutomationReadProps) {
  const [search, setSearch] = useState('');
  const [updateAutomation] = useUpdateAutomationMutation();

  // Stats
  const totalCount = automations.length;
  const activeCount = automations.filter((a: any) => a.enabled).length;
  const inactiveCount = totalCount - activeCount;

  const filtered = automations.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = async (automation: any) => {
    try {
      await updateAutomation({
        id: automation.id,
        enabled: !automation.enabled,
      }).unwrap();
      toast.success(automation.enabled ? 'Automation disabled' : 'Automation enabled');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update automation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (automations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Automations</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-green-500/10">
            <ToggleRight className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search automations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No automations match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        /* Automation cards grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((automation: any) => {
            const trigger = getTrigger(automation.trigger);
            const action = getAction(automation.action);
            const disabled = !automation.enabled;

            return (
              <div
                key={automation.id}
                className={`group relative bg-card border border-border rounded-xl p-5 transition-all hover:shadow-md hover:border-primary/40 ${
                  disabled ? 'opacity-50' : ''
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate flex-1">
                    {automation.name}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && (
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => handleToggle(automation)}
                      />
                    )}
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditAutomation(automation)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteAutomation(automation)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {automation.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {automation.description}
                  </p>
                )}
                {!automation.description && <div className="mb-4" />}

                {/* Visual flow */}
                <div className="space-y-0">
                  {/* WHEN */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                      When
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${trigger.color}`}
                  >
                    <span className="text-base leading-none">{trigger.icon}</span>
                    <span className="text-sm font-medium">{trigger.label}</span>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                  </div>

                  {/* THEN */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                      Then
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${action.color}`}
                  >
                    <span className="text-base leading-none">{action.icon}</span>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {automation.createdBy && (
                      <>
                        Created by{' '}
                        <span className="font-medium text-foreground">
                          {automation.createdBy.name || automation.createdBy.email}
                        </span>
                      </>
                    )}
                    {automation.createdAt && (
                      <>
                        {automation.createdBy ? ' \u00B7 ' : ''}
                        {timeAgo(automation.createdAt)}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
