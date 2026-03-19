'use client';

import { useState } from 'react';
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
import { useUpdateTaskMutation, useToggleAssignmentMutation } from '@/store/api';
import FileUpload from '@/components/ui/file-upload';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface EditTaskFormProps {
  taskId: string;
  projectId: string;
  currentStatus: string;
  currentPriority: string;
  members?: { id: string; name: string | null; email: string }[];
  attachments?: Attachment[];
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

export default function EditTaskForm({
  taskId,
  projectId,
  currentStatus,
  currentPriority,
  members = [],
  attachments = [],
}: EditTaskFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [toggleAssignment, { isLoading: isAssigning }] = useToggleAssignmentMutation();

  const handleUpdate = async (data: { status?: string; priority?: string }) => {
    try {
      await updateTask({ id: taskId, ...data }).unwrap();
      toast.success('Task updated');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await toggleAssignment({ taskId, userId }).unwrap();
      toast.success('Assignment updated');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update assignment');
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="font-bold text-foreground">Edit Task</h3>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            handleUpdate({ status: value });
          }}
          disabled={isUpdating}
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
            handleUpdate({ priority: value });
          }}
          disabled={isUpdating}
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

      {/* File Attachments */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm font-medium text-foreground mb-3">Attachments</p>
        <FileUpload taskId={taskId} attachments={attachments} />
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
                onClick={() => handleAssign(member.id)}
                disabled={isAssigning}
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
