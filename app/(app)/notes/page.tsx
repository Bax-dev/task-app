'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export default function NotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<any[]>('/api/organizations'),
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['organizations', selectedOrg, 'notes'],
    queryFn: () => api.get<any[]>(`/api/organizations/${selectedOrg}/notes`),
    enabled: !!selectedOrg,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['organizations', selectedOrg, 'members'],
    queryFn: () => api.get<any[]>(`/api/organizations/${selectedOrg}/members`),
    enabled: !!selectedOrg,
  });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  const createNoteMutation = useMutation({
    mutationFn: () =>
      api.post('/api/notes', { title: noteTitle, organizationId: selectedOrg }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', selectedOrg, 'notes'] });
      toast.success('Note created');
      setNewNoteOpen(false);
      setNoteTitle('');
      router.push(`/notes/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => api.delete(`/api/notes/${noteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', selectedOrg, 'notes'] });
      toast.success('Note deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Auto-select first org
  if (organizations.length > 0 && !selectedOrg) {
    setSelectedOrg(organizations[0].id);
  }

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-2">Documents and system design notes</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrg && !isGuest && (
            <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createNoteMutation.mutate(); }} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="e.g. System Architecture, API Design"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createNoteMutation.isPending}>
                    {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!selectedOrg ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view notes</p>
        </div>
      ) : notesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note: any) => (
            <div key={note.id} className="relative group">
              <Link href={`/notes/${note.id}`}>
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {note.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {note.createdBy?.name || note.createdBy?.email}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              {!isGuest && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">Create your first note to get started</p>
          {!isGuest && (
            <Button onClick={() => setNewNoteOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
