'use client';

import { use, useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  X,
  Loader2,
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  AtSign,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useCreateTaskMutation,
  useGetProjectQuery,
  useGetOrgMembersQuery,
  useGetMeQuery,
} from '@/store/api';
import { api } from '@/lib/api-client';
import type { Member } from '@/types/organization';

interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');

  // Assignment state
  const [assignedUsers, setAssignedUsers] = useState<Member[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const assignInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useGetMeQuery();
  const { data: project } = useGetProjectQuery(projectId);
  const orgId = project?.space?.organizationId || '';
  const { data: members = [] } = useGetOrgMembersQuery(orgId, { skip: !orgId });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();

  // Filter members for the dropdown
  const filteredMembers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((u) => u.id));
    const search = assignSearch.replace(/^@/, '').toLowerCase();
    return members.filter(
      (m: Member) =>
        !assignedIds.has(m.id) &&
        (m.name?.toLowerCase().includes(search) || m.email.toLowerCase().includes(search))
    );
  }, [members, assignedUsers, assignSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAssignDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAssignInput = (value: string) => {
    setAssignSearch(value);

    // @all assigns everyone
    if (value.toLowerCase() === '@all') {
      const assignedIds = new Set(assignedUsers.map((u) => u.id));
      const newMembers = members.filter((m: Member) => !assignedIds.has(m.id));
      setAssignedUsers([...assignedUsers, ...newMembers]);
      setAssignSearch('');
      setShowAssignDropdown(false);
      toast.success(`Assigned all ${newMembers.length} member${newMembers.length !== 1 ? 's' : ''}`);
      return;
    }

    setShowAssignDropdown(value.length > 0);
  };

  const addAssignee = (member: Member) => {
    setAssignedUsers((prev) => [...prev, member]);
    setAssignSearch('');
    setShowAssignDropdown(false);
    assignInputRef.current?.focus();
  };

  const removeAssignee = (userId: string) => {
    setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.post<{ uploadUrl: string; attachment: UploadedFile }>('/api/upload', {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      await fetch(res.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setUploadedFiles((prev) => [...prev, res.attachment]);
      toast.success('File uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    // Optionally delete from S3 — skipping for now since it's not yet linked to a task
  };

  const handleCreate = async () => {
    try {
      const result = await createTask({
        title,
        description: description || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        projectId,
        assigneeIds: assignedUsers.length > 0 ? assignedUsers.map((u) => u.id) : undefined,
      }).unwrap();

      // Link uploaded files to the created task
      if (uploadedFiles.length > 0 && result?.id) {
        for (const file of uploadedFiles) {
          try {
            await api.patch(`/api/upload/${file.id}`, { taskId: result.id });
          } catch {
            // Non-critical — file was uploaded but linking failed
          }
        }
      }

      toast.success('Task created!');
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create task');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Project
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Task</h1>
        {project && (
          <p className="text-sm text-muted-foreground mt-1">
            in {project.name}
          </p>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What needs to be done?"
            className="text-base"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={4}
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Low</span>
                </SelectItem>
                <SelectItem value="MEDIUM">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span>
                </SelectItem>
                <SelectItem value="HIGH">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                </SelectItem>
                <SelectItem value="URGENT">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Urgent</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Assign Members */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Assign Members
          </Label>
          <p className="text-xs text-muted-foreground">
            Type <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">@name</kbd> to assign a member or <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">@all</kbd> to assign everyone
          </p>

          {/* Assigned badges */}
          {assignedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {assignedUsers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
                    {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </span>
                  {member.name || member.email}
                  <button
                    type="button"
                    onClick={() => removeAssignee(member.id)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* @ input with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={assignInputRef}
              value={assignSearch}
              onChange={(e) => handleAssignInput(e.target.value)}
              onFocus={() => { if (assignSearch.length > 0) setShowAssignDropdown(true); }}
              placeholder="Type @name or @all..."
              className="pl-9"
            />

            {showAssignDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                {assignSearch.toLowerCase().startsWith('@al') && assignSearch.toLowerCase() !== '@all' && (
                  <button
                    type="button"
                    onClick={() => handleAssignInput('@all')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left border-b border-border"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Assign everyone</p>
                      <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                )}
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member: Member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => addAssignee(member)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 capitalize">{member.role.toLowerCase()}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                    No matching members
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* File Attachments */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Paperclip className="w-4 h-4" />
            Attachments
          </Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">Click to upload (max 5MB)</p>
                <p className="text-xs text-muted-foreground">Images, PDF, Word, Text</p>
              </>
            )}
          </button>

          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 group">
                  {file.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate flex-1">{file.fileName}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatSize(file.fileSize)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isCreating || !title.trim()} className="gap-1.5">
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
          <Link href={`/projects/${projectId}`}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>

          {assignedUsers.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {assignedUsers.length} assignee{assignedUsers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
