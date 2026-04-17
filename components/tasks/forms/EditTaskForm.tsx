'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AtSign, Loader2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useUpdateTaskMutation,
  useToggleAssignmentMutation,
  useGetOrgMembersQuery,
} from '@/store/api';

interface Member {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

interface EditTaskFormProps {
  taskId: string;
  orgId: string;
  initial: {
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    assignToSpace?: boolean;
    assignees?: { id: string; name: string | null; email: string }[];
    spaceName?: string;
  };
  onSaved?: () => void;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

export default function EditTaskForm({ taskId, orgId, initial, onSaved }: EditTaskFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description || '');
  const [status, setStatus] = useState(initial.status);
  const [priority, setPriority] = useState(initial.priority);
  const [dueDate, setDueDate] = useState(
    initial.dueDate ? new Date(initial.dueDate).toISOString().split('T')[0] : ''
  );
  const [assignToSpace, setAssignToSpace] = useState(Boolean(initial.assignToSpace));
  const [assignees, setAssignees] = useState<Member[]>(initial.assignees || []);
  const [assignSearch, setAssignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: members = [] } = useGetOrgMembersQuery(orgId, { skip: !orgId });
  const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();
  const [toggleAssignment] = useToggleAssignmentMutation();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredMembers = useMemo(() => {
    const assigned = new Set(assignees.map((u) => u.id));
    const search = assignSearch.replace(/^@/, '').toLowerCase();
    return (members as Member[]).filter(
      (m) =>
        !assigned.has(m.id) &&
        (m.name?.toLowerCase().includes(search) || m.email.toLowerCase().includes(search))
    );
  }, [members, assignees, assignSearch]);

  async function addAssignee(member: Member) {
    try {
      await toggleAssignment({ taskId, userId: member.id }).unwrap();
      setAssignees((prev) => [...prev, member]);
      setAssignSearch('');
      setShowDropdown(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign');
    }
  }

  async function removeAssignee(userId: string) {
    try {
      await toggleAssignment({ taskId, userId }).unwrap();
      setAssignees((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to unassign');
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateTask({
        id: taskId,
        title: title.trim(),
        description: description.trim() || null,
        status: status as any,
        priority: priority as any,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignToSpace,
      }).unwrap();
      toast.success('Task updated');
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        className="text-base font-medium"
        disabled={isSaving}
      />

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-8 w-auto text-xs"
        />
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <Switch checked={assignToSpace} onCheckedChange={setAssignToSpace} />
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {initial.spaceName ? `Whole ${initial.spaceName}` : 'Whole space'}
          </span>
        </label>
      </div>

      {/* Assignees — @-search */}
      {!assignToSpace && (
        <div ref={dropdownRef} className="relative space-y-2">
          {assignees.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assignees.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => removeAssignee(u.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
                    {(u.name?.[0] || u.email[0]).toUpperCase()}
                  </span>
                  {u.name || u.email}
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={assignSearch}
              onChange={(event) => {
                setAssignSearch(event.target.value);
                setShowDropdown(event.target.value.length > 0);
              }}
              onFocus={() => setShowDropdown(assignSearch.length > 0)}
              placeholder="Assign… type @ name or email"
              className="pl-8 h-9"
            />
          </div>
          {showDropdown && filteredMembers.length > 0 && (
            <div className="absolute z-20 left-0 right-0 max-h-52 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => addAssignee(m)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {(m.name?.[0] || m.email[0]).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{m.name || m.email}</span>
                    {m.name && (
                      <span className="block truncate text-[11px] text-muted-foreground">{m.email}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          disabled={isSaving}
          placeholder="Add context, acceptance criteria, or links"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isSaving || !title.trim()}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </form>
  );
}
