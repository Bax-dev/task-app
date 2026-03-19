'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ArrowLeft, Loader2, FolderOpen, Trash2, Pencil, Check, X } from 'lucide-react';
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
import { useGetSpaceQuery, useGetOrgMembersQuery, useCreateProjectMutation, useUpdateSpaceMutation, useDeleteSpaceMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const { data: space, isLoading } = useGetSpaceQuery(id);

  const orgId = space?.organizationId || space?.organization?.id;
  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();
  const [updateSpace] = useUpdateSpaceMutation();
  const [deleteSpace] = useDeleteSpaceMutation();

  const handleCreateProject = async () => {
    try {
      const data = await createProject({ name: projectName, description: projectDesc || undefined, spaceId: id }).unwrap();
      toast.success('Project created!');
      setNewProjectOpen(false);
      setProjectName('');
      setProjectDesc('');
      router.push(`/projects/${data.id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create project');
    }
  };

  const handleRenameSpace = async (name: string) => {
    try {
      await updateSpace({ id, name }).unwrap();
      toast.success('Space renamed');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to rename');
    }
  };

  const handleDeleteSpace = async () => {
    try {
      await deleteSpace(id).unwrap();
      toast.success('Space deleted');
      router.push('/organizations');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="p-8">
      <Link
        href={`/organizations/${space.organization?.id || space.organizationId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organization
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: space.color + '20' }}>
            <div className="w-5 h-5 rounded" style={{ backgroundColor: space.color }} />
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold h-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editName.trim()) handleRenameSpace(editName.trim());
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => { if (editName.trim()) handleRenameSpace(editName.trim()); }} disabled={false}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-foreground">{space.name}</h1>
                {!isGuest && (
                  <button
                    onClick={() => { setEditName(space.name); setIsEditing(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            {space.description && <p className="text-muted-foreground mt-1">{space.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isGuest && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Space</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete &quot;{space.name}&quot; and all its projects and tasks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteSpace()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}

          {!isGuest && (
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project in {space.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="My Project" required />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Brief description" rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={isCreatingProject}>
                  {isCreatingProject ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Projects in this space */}
      {space.projects && space.projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {space.projects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group">
              <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-bold text-primary group-hover:underline mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                )}
                <p className="text-sm text-muted-foreground">{project._count?.tasks || 0} tasks</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project in this space</p>
          {!isGuest && (
            <Button onClick={() => setNewProjectOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
