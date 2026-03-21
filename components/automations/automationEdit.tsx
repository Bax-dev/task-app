'use client';

import { useState, useEffect } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateAutomationMutation } from '@/store/api';

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

const TRIGGER_OPTIONS = Object.entries(TRIGGERS).map(([value, meta]) => ({ value, ...meta }));
const ACTION_OPTIONS = Object.entries(ACTIONS).map(([value, meta]) => ({ value, ...meta }));

interface AutomationEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: {
    id: string;
    name: string;
    description: string | null;
    trigger: string;
    action: string;
    enabled: boolean;
  };
}

export default function AutomationEdit({
  open,
  onOpenChange,
  automation,
}: AutomationEditProps) {
  const [name, setName] = useState(automation.name);
  const [description, setDescription] = useState(automation.description || '');
  const [trigger, setTrigger] = useState(automation.trigger);
  const [action, setAction] = useState(automation.action);
  const [enabled, setEnabled] = useState(automation.enabled);

  const [updateAutomation, { isLoading: isUpdating }] = useUpdateAutomationMutation();

  // Sync local state when the automation prop changes
  useEffect(() => {
    setName(automation.name);
    setDescription(automation.description || '');
    setTrigger(automation.trigger);
    setAction(automation.action);
    setEnabled(automation.enabled);
  }, [automation]);

  const handleUpdate = async () => {
    try {
      await updateAutomation({
        id: automation.id,
        name,
        description,
        trigger,
        action,
        enabled,
      }).unwrap();
      toast.success('Automation updated');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update automation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
        >
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Edit Automation
              </span>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Automation Name"
            className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-2 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
            required
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this automation does..."
            className="w-full border-0 bg-transparent resize-none min-h-[60px] px-5 py-2 placeholder:text-muted-foreground/40 text-sm focus:outline-none"
            rows={2}
          />
          <div className="border-t border-border" />
          <div className="px-5 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                When
              </span>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="flex-1 h-8 text-xs rounded-full">
                  <SelectValue placeholder="Select trigger event..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="mr-1.5">{t.icon}</span>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                Then
              </span>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="flex-1 h-8 text-xs rounded-full">
                  <SelectValue placeholder="Select action to perform..." />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      <span className="mr-1.5">{a.icon}</span>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <span className="text-sm text-muted-foreground">
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <Button
              type="submit"
              disabled={isUpdating || !name.trim() || !trigger || !action}
              size="sm"
              className="gap-1.5 px-5"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
