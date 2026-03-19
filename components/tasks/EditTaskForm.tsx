'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface EditTaskFormProps {
  taskId: string;
  projectId: string;
  currentStatus: string;
  currentPriority: string;
  members?: { id: string; name: string | null; email: string }[];
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

export default function EditTaskForm({
  taskId,
  projectId,
  currentStatus,
  currentPriority,
  members = [],
}: EditTaskFormProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; priority?: string }) =>
      api.patch(`/api/tasks/${taskId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      toast.success('Task updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/api/tasks/${taskId}/assign`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast.success('Assignment updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="font-bold text-foreground">Edit Task</h3>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            updateMutation.mutate({ status: value });
          }}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={priority}
          onValueChange={(value) => {
            setPriority(value);
            updateMutation.mutate({ priority: value });
          }}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {members.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-3">
            Assign to team member
          </p>
          <div className="space-y-2">
            {members.map((member) => (
              <Button
                key={member.id}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => assignMutation.mutate(member.id)}
                disabled={assignMutation.isPending}
              >
                {member.name || member.email}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
