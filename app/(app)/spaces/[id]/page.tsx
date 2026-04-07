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
import { Plus, ArrowLeft, Loader2, FolderOpen, Trash2, Pencil, Briefcase, Code, Megaphone, BarChart3, Users, Settings, Globe, Star, Zap } from 'lucide-react';
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
import { useGetSpaceQuery, useGetOrgMembersQuery, useCreateProjectMutation, useUpdateSpaceMutation, useDeleteSpaceMutation, useDeleteProjectMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

const SPACE_ICONS = [
  { value: 'folder', label: 'Folder', icon: FolderOpen },
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'megaphone', label: 'Megaphone', icon: Megaphone },
  { value: 'chart', label: 'Chart', icon: BarChart3 },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'settings', label: 'Settings', icon: Settings },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'zap', label: 'Zap', icon: Zap },
];

function getSpaceIcon(iconName: string) {
  return SPACE_ICONS.find((i) => i.value === iconName)?.icon || FolderOpen;
}

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

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const { data: space, isLoading } = useGetSpaceQuery(id);

  const orgId = space?.organizationId || space?.organization?.id;
  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();
  const [updateSpace, { isLoading: isUpdatingSpace }] = useUpdateSpaceMutation();
  const [deleteSpace] = useDeleteSpaceMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const openEditDialog = () => {
    if (!space) return;
    setEditName(space.name);
    setEditDescription(space.description || '');
    setEditColor(space.color);
    setEditIcon(space.icon);
    setEditOpen(true);
  };

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

  const handleUpdateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSpace({
        id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        color: editColor,
        icon: editIcon,
      }).unwrap();
      toast.success('Space updated');
      setEditOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update space');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId).unwrap();
      toast.success('Project deleted');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete project');
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

  const SpaceIcon = getSpaceIcon(space.icon);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Link
        href={`/organizations/${space.organization?.id || space.organizationId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organization
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: space.color + '20' }}>
            <SpaceIcon className="w-5 h-5" style={{ color: space.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{space.name}</h1>
              {!isGuest && (
                <button
                  onClick={openEditDialog}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {space.description && <p className="text-muted-foreground mt-1">{space.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isGuest && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
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
                <AlertDialogAction onClick={() => handleDeleteSpace()} className="bg-muted-foreground text-background hover:bg-muted-foreground/90">
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

      {/* Edit Space Dialog */}
      {!isGuest && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Space</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSpace} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Space Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Space name"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What is this space for? (max 500 characters)"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {SPACE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${editColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {SPACE_ICONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setEditIcon(item.value)}
                        className={`w-9 h-9 rounded-md flex items-center justify-center border-2 transition-all ${
                          editIcon === item.value
                            ? 'border-foreground bg-muted'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isUpdatingSpace || !editName.trim()}>
                {isUpdatingSpace ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Projects in this space */}
      {space.projects && space.projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {space.projects.map((project: any) => (
            <div key={project.id} className="relative group/card">
              <Link href={`/projects/${project.id}`} className="group">
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-bold text-primary group-hover:underline mb-2 pr-8">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{project._count?.tasks || 0} tasks</p>
                </div>
              </Link>
              {!isGuest && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Project</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete &quot;{project.name}&quot; and all its tasks. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-muted-foreground text-background hover:bg-muted-foreground/90">
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
