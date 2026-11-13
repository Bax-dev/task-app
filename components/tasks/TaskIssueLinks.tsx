'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateIssueLinkMutation,
  useDeleteIssueLinkMutation,
  useGetProjectTasksQuery,
  useGetTaskIssueLinksQuery,
} from '@/store/api';

const LINK_TYPES: Record<string, { label: string; inverse: string }> = {
  BLOCKS: { label: 'blocks', inverse: 'BLOCKED_BY' },
  BLOCKED_BY: { label: 'is blocked by', inverse: 'BLOCKS' },
  DUPLICATES: { label: 'duplicates', inverse: 'DUPLICATED_BY' },
  DUPLICATED_BY: { label: 'is duplicated by', inverse: 'DUPLICATES' },
  CLONES: { label: 'clones', inverse: 'CLONED_BY' },
  CLONED_BY: { label: 'is cloned by', inverse: 'CLONES' },
  RELATES_TO: { label: 'relates to', inverse: 'RELATES_TO' },
};

interface TaskIssueLinksProps {
  taskId: string;
  projectId: string;
  readOnly?: boolean;
}

export default function TaskIssueLinks({ taskId, projectId, readOnly }: TaskIssueLinksProps) {
  const { data: links = [], isLoading } = useGetTaskIssueLinksQuery(taskId);
  const { data: projectTasks = [] } = useGetProjectTasksQuery(projectId, { skip: readOnly });
  const [createIssueLink, { isLoading: isCreating }] = useCreateIssueLinkMutation();
  const [deleteIssueLink] = useDeleteIssueLinkMutation();

  const [linkType, setLinkType] = useState('RELATES_TO');
  const [targetTaskId, setTargetTaskId] = useState('');

  const linkedIds = new Set(links.flatMap((l) => [l.sourceTaskId, l.targetTaskId]));
  const candidates = projectTasks.filter((t) => t.id !== taskId && !linkedIds.has(t.id));

  const handleAdd = async () => {
    if (!targetTaskId) return;
    try {
      await createIssueLink({ sourceTaskId: taskId, targetTaskId, linkType }).unwrap();
      setTargetTaskId('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to link task');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteIssueLink(id).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to remove link');
    }
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : links.length === 0 ? (
        <p className="text-xs text-muted-foreground">No linked tasks</p>
      ) : (
        <ul className="space-y-1">
          {links.map((l) => {
            // Links are stored one-way; show the inverse wording when this task is the target.
            const isSource = l.sourceTaskId === taskId;
            const other = isSource ? l.targetTask : l.sourceTask;
            const type = isSource ? l.linkType : LINK_TYPES[l.linkType]?.inverse ?? l.linkType;
            return (
              <li key={l.id} className="group flex items-center gap-2 text-sm rounded px-2 py-1 -mx-2 hover:bg-secondary/30">
                <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{LINK_TYPES[type]?.label ?? type}</span>
                {other ? (
                  <Link href={`/projects/${projectId}/tasks/${other.id}`} className="flex-1 min-w-0 truncate hover:underline">
                    <span className="font-mono text-xs text-muted-foreground mr-1.5">#{other.taskNumber}</span>
                    {other.title}
                  </Link>
                ) : (
                  <span className="flex-1" />
                )}
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Remove link to ${other?.title ?? 'task'}`}
                    onClick={() => handleRemove(l.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={linkType} onValueChange={setLinkType}>
            <SelectTrigger className="h-8 text-xs sm:w-36" aria-label="Link type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LINK_TYPES).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={targetTaskId} onValueChange={setTargetTaskId}>
            <SelectTrigger className="h-8 text-xs flex-1 min-w-0" aria-label="Task to link">
              <SelectValue placeholder={candidates.length ? 'Select task…' : 'No tasks to link'} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.taskNumber ? `#${t.taskNumber} ` : ''}{t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" disabled={!targetTaskId || isCreating} onClick={handleAdd}>
            Link
          </Button>
        </div>
      )}
    </div>
  );
}
