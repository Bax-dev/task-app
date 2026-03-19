'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Activity, Plus, Loader2, Circle, PlayCircle, CheckCircle2, AlertTriangle, Trash2, Pencil, Paperclip, Upload } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, selectView } from '@/store/slices/viewSlice';
import { toast } from 'sonner';
import { useGetUserActivityLogsQuery, useGetOrganizationsQuery, useGetUserTasksQuery, useCreateActivityLogMutation, useUpdateActivityLogMutation, useDeleteActivityLogMutation } from '@/store/api';
import FileUpload from '@/components/ui/file-upload';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', icon: <Circle className="w-4 h-4 text-gray-400" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-200', dot: 'bg-blue-500', icon: <PlayCircle className="w-4 h-4 text-blue-500" /> },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-200', dot: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
  BLOCKED: { label: 'Blocked', color: 'bg-red-500/10 text-red-600 border-red-200', dot: 'bg-red-500', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
};

export default function ActivityLogsPage() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView('activity-logs'));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [open, setOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [note, setNote] = useState('');
  const [orgId, setOrgId] = useState('');
  const [taskId, setTaskId] = useState('');

  const { data: logs = [], isLoading } = useGetUserActivityLogsQuery();

  const { data: organizations = [] } = useGetOrganizationsQuery();

  const { data: tasks = [] } = useGetUserTasksQuery();

  const [createActivityLog, { isLoading: isCreating }] = useCreateActivityLogMutation();
  const [updateActivityLog, { isLoading: isUpdatePending }] = useUpdateActivityLogMutation();
  const [deleteActivityLog] = useDeleteActivityLogMutation();

  const handleCreate = async () => {
    try {
      const newLog = await createActivityLog({
        description,
        status,
        note: note || undefined,
        organizationId: orgId,
        taskId: taskId || undefined,
      }).unwrap();
      toast.success('Activity logged! You can now attach files.');
      setEditingLog(newLog);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to log activity');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateActivityLog({
        id: editingLog.id,
        description,
        status,
        note: note || null,
        taskId: taskId || null,
      }).unwrap();
      toast.success('Activity updated!');
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteActivityLog(id).unwrap();
      toast.success('Activity log deleted');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete');
    }
  };

  function resetForm() {
    setOpen(false);
    setEditingLog(null);
    setDescription('');
    setStatus('IN_PROGRESS');
    setNote('');
    setOrgId('');
    setTaskId('');
  }

  function openEdit(log: any) {
    setEditingLog(log);
    setDescription(log.description);
    setStatus(log.status);
    setNote(log.note || '');
    setOrgId(log.organizationId);
    setTaskId(log.taskId || '');
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingLog) {
      handleUpdate();
    } else {
      handleCreate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredLogs = statusFilter === 'ALL' ? logs : logs.filter((l: any) => l.status === statusFilter);

  const statusCounts = {
    ALL: logs.length,
    NOT_STARTED: logs.filter((l: any) => l.status === 'NOT_STARTED').length,
    IN_PROGRESS: logs.filter((l: any) => l.status === 'IN_PROGRESS').length,
    COMPLETED: logs.filter((l: any) => l.status === 'COMPLETED').length,
    BLOCKED: logs.filter((l: any) => l.status === 'BLOCKED').length,
  };

  const isPending = isCreating || isUpdatePending;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Record and track what you&apos;re working on</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={(v) => dispatch(setView({ page: 'activity-logs', mode: v }))} />
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLog ? 'Edit Activity' : 'Log New Activity'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {!editingLog && (
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Select value={orgId} onValueChange={setOrgId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org: any) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="log-desc">What are you working on?</Label>
                  <Input
                    id="log-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Designing the new landing page"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-note">Note (optional)</Label>
                  <Textarea
                    id="log-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any additional details..."
                    rows={3}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link to Task (optional)</Label>
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tasks.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Attachments (max 5MB each)</Label>
                  {editingLog ? (
                    <FileUpload activityLogId={editingLog.id} attachments={editingLog.attachments || []} />
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Save activity first, then attach files</p>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isPending || (!editingLog && !orgId)}>
                  {isPending ? (editingLog ? 'Updating...' : 'Logging...') : (editingLog ? 'Update Activity' : 'Log Activity')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              {config.icon}
              <div>
                <p className="text-xs text-muted-foreground">{config.label}</p>
                <p className="text-2xl font-bold text-foreground">{statusCounts[key as keyof typeof statusCounts]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'NOT_STARTED', label: 'Not Started' },
          { key: 'IN_PROGRESS', label: 'In Progress' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'BLOCKED', label: 'Blocked' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f.key !== 'ALL' && <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[f.key]?.dot}`} />}
            {f.label}
            <span className="text-xs opacity-70">{statusCounts[f.key as keyof typeof statusCounts]}</span>
          </button>
        ))}
      </div>

      {logs.length > 0 ? (
        view === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogs.map((log: any) => {
              const config = STATUS_CONFIG[log.status] || STATUS_CONFIG.IN_PROGRESS;
              return (
                <div key={log.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
                      {config.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(log)} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteLog(log.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground text-sm mb-2">{log.description}</h3>
                  {log.note && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{log.note}</p>
                  )}
                  {log.attachments && log.attachments.length > 0 && (
                    <div className="mb-3">
                      <FileUpload activityLogId={log.id} attachments={log.attachments} compact />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {log.task && (
                      <span className="inline-block px-2 py-0.5 rounded bg-secondary/50 truncate max-w-[150px]">{log.task.title}</span>
                    )}
                    {log.attachments && log.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" />{log.attachments.length}</span>
                    )}
                    <span className="ml-auto">{new Date(log.loggedAt).toLocaleDateString()}</span>
                  </div>
                  {log.organization && (
                    <p className="text-xs text-muted-foreground mt-2">{log.organization.name}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Activity</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Task</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Organization</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Logged</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log: any) => {
                  const config = STATUS_CONFIG[log.status] || STATUS_CONFIG.IN_PROGRESS;
                  return (
                    <tr key={log.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{log.description}</p>
                        {log.note && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.note}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.task?.title || '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.organization?.name || '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.loggedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(log)} className="text-xs px-2 py-1 rounded bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">Edit</button>
                          <button onClick={() => handleDeleteLog(log.id)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No activity logs yet</h3>
          <p className="text-muted-foreground mb-4">Start recording what you&apos;re working on</p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        </div>
      )}
    </div>
  );
}
