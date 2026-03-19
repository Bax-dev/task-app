'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Paperclip, Download, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAppDispatch } from '@/store/hooks';
import { apiSlice } from '@/store/api';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
].join(',');

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface FileUploadProps {
  taskId?: string;
  activityLogId?: string;
  noteId?: string;
  attachments?: Attachment[];
  compact?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isImage(mimeType)) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-orange-500" />;
}

export default function FileUpload({ taskId, activityLogId, noteId, attachments: initialAttachments, compact }: FileUploadProps) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const attachments = initialAttachments || [];

  function invalidateParent() {
    const tags: any[] = [];
    if (taskId) tags.push({ type: 'Tasks', id: taskId });
    if (activityLogId) tags.push({ type: 'ActivityLogs', id: 'LIST' });
    if (noteId) tags.push({ type: 'Notes', id: noteId });
    if (tags.length) dispatch(apiSlice.util.invalidateTags(tags));
  }

  async function handleUpload(file: File) {
    if (file.size > MAX_SIZE) { toast.error('File size exceeds 5MB limit'); return; }
    setUploading(true);
    try {
      const res = await api.post<{ uploadUrl: string; attachment: Attachment }>('/api/upload', {
        fileName: file.name, mimeType: file.type, fileSize: file.size,
        taskId, activityLogId, noteId,
      });
      const uploadRes = await fetch(res.uploadUrl, {
        method: 'PUT', body: file, headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');
      invalidateParent();
      toast.success('File uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.delete(`/api/upload/${id}`);
      invalidateParent();
      toast.success('Attachment removed');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    e.target.value = '';
  }

  const openPreview = useCallback(async (att: Attachment) => {
    setPreviewName(att.fileName);
    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      const res = await api.get<{ url: string }>(`/api/upload/${att.id}/view`);
      setPreviewUrl(res.url);
    } catch {
      toast.error('Failed to load file');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (att: Attachment) => {
    try {
      const res = await api.get<{ url: string }>(`/api/upload/${att.id}/view`);
      const link = document.createElement('a');
      link.href = res.url;
      link.download = att.fileName;
      link.click();
    } catch {
      toast.error('Failed to download file');
    }
  }, []);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />

      {compact ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          Attach file
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm text-muted-foreground">Click to upload (max 5MB)</p>
              <p className="text-xs text-muted-foreground">Images, PDF, Word, Excel, Text</p>
            </>
          )}
        </button>
      )}

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 group"
            >
              <FileIcon mimeType={att.mimeType} />
              <button
                onClick={() => isImage(att.mimeType) ? openPreview(att) : downloadFile(att)}
                className="text-sm text-foreground hover:text-primary hover:underline truncate flex-1 text-left"
              >
                {att.fileName}
              </button>
              <span className="text-xs text-muted-foreground shrink-0">{formatSize(att.fileSize)}</span>
              {isImage(att.mimeType) && (
                <button
                  onClick={() => openPreview(att)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  title="Preview"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => downloadFile(att)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(att.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Delete"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In-App Image Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 bg-black/80">
              <span className="text-sm text-white/80 truncate">{previewName}</span>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <a href={previewUrl} download={previewName}>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center min-h-[400px] max-h-[80vh] w-full p-4">
              {previewLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewName}
                  className="max-w-full max-h-[75vh] object-contain rounded"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
