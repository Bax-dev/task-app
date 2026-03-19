'use client';

import { use, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, Trash2, Pencil, Check, X, Save, Download, FileText, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useGetNoteQuery, useGetOrgMembersQuery, useUpdateNoteMutation, useDeleteNoteMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import FileUpload from '@/components/ui/file-upload';

const RichTextEditor = dynamic(() => import('@/components/notes/RichTextEditor'), { ssr: false });

export default function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const currentContentRef = useRef<string>('');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: note, isLoading } = useGetNoteQuery(id);

  const orgId = note?.organizationId;

  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const handleContentChange = useCallback((html: string) => {
    currentContentRef.current = html;
    setHasUnsavedChanges(true);
    // Auto-save after 3 seconds of inactivity
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote({ id, content: html }).unwrap().then(() => setHasUnsavedChanges(false)).catch(() => {});
    }, 3000);
  }, [updateNote, id]);

  const handleManualSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    updateNote({ id, content: currentContentRef.current }).unwrap().then(() => {
      setHasUnsavedChanges(false);
      toast.success('Note saved');
    }).catch((error: any) => {
      toast.error(error?.data?.message || 'Failed to save');
    });
  }, [updateNote, id]);

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== note?.title) {
      updateNote({ id, title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const getExportHtml = useCallback(() => {
    const title = note?.title || 'Untitled';
    const content = currentContentRef.current || note?.content || '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.6; }
          h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
          h2 { font-size: 22px; color: #222; }
          h3 { font-size: 18px; color: #333; }
          p { margin: 8px 0; }
          ul, ol { padding-left: 24px; }
          blockquote { border-left: 3px solid #ccc; padding-left: 16px; margin: 12px 0; color: #666; font-style: italic; }
          code { background: #f4f4f4; border-radius: 3px; padding: 2px 6px; font-size: 0.9em; }
          pre { background: #f4f4f4; border-radius: 6px; padding: 16px; overflow-x: auto; }
          pre code { background: none; padding: 0; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #f4f4f4; font-weight: 600; }
          hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
          mark { background-color: #fef08a; padding: 1px 4px; border-radius: 2px; }
          .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Exported on ${new Date().toLocaleDateString()}</div>
        ${content}
      </body>
      </html>
    `;
  }, [note]);

  const exportAsPdf = useCallback(() => {
    const html = getExportHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [getExportHtml]);

  const exportAsWord = useCallback(async () => {
    try {
      const { asBlob } = await import('html-docx-js-typescript');
      const html = getExportHtml();
      const blob = await asBlob(html) as Blob;
      const { saveAs } = await import('file-saver');
      const filename = `${note?.title || 'note'}.docx`;
      saveAs(blob, filename);
      toast.success(`Exported as ${filename}`);
    } catch {
      toast.error('Failed to export as Word');
    }
  }, [getExportHtml, note?.title]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!note) return null;

  // Initialize content ref on first render
  if (!currentContentRef.current && note.content) {
    currentContentRef.current = note.content;
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Link>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {!isSaving && hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}

          {/* Save button */}
          {!isGuest && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleManualSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsPdf} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsWord} className="gap-2 cursor-pointer">
                <FileIcon className="w-4 h-4" />
                Export as Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete */}
          {!isGuest && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{note.title}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteNote(id).unwrap();
                        toast.success('Note deleted');
                        router.push('/notes');
                      } catch (error: any) {
                        toast.error(error?.data?.message || error?.message || 'Failed to delete');
                      }
                    }}
                    className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-3xl font-bold h-12"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
            />
            <Button size="icon" variant="ghost" onClick={handleTitleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-3xl font-bold text-foreground">{note.title}</h1>
            {!isGuest && (
              <button
                onClick={() => { setEditTitle(note.title); setIsEditingTitle(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          by {note.createdBy?.name || note.createdBy?.email} &middot; Updated {new Date(note.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Attachments */}
      {!isGuest && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-2">Attachments</h3>
          <FileUpload noteId={id} attachments={note.attachments || []} />
        </div>
      )}

      {/* Editor */}
      <RichTextEditor
        content={note.content || ''}
        onChange={handleContentChange}
        editable={!isGuest}
      />
    </div>
  );
}
