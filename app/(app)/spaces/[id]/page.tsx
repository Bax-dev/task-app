'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  ArrowLeft,
  FolderOpen,
  Trash2,
  Pencil,
  Briefcase,
  Code,
  Megaphone,
  BarChart3,
  Users,
  Settings,
  Globe,
  Star,
  Zap,
  UserMinus,
  UserPlus,
  Check,
} from 'lucide-react';
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
import {
  useGetSpaceQuery,
  useGetOrgMembersQuery,
  useCreateProjectMutation,
  useUpdateSpaceMutation,
  useDeleteSpaceMutation,
  useDeleteProjectMutation,
  useGetSpaceMembersQuery,
  useAddSpaceMemberMutation,
  useRemoveSpaceMemberMutation,
} from '@/store/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const isAdmin = currentUserRole === 'ADMIN';

  const { data: spaceMembers = [] } = useGetSpaceMembersQuery(id);
  const [addSpaceMember, { isLoading: isAddingMember }] = useAddSpaceMemberMutation();
  const [removeSpaceMember] = useRemoveSpaceMemberMutation();
  const [manageMembersOpen, setManageMembersOpen] = useState(false);

  const spaceMemberIds = new Set(spaceMembers.map((m: any) => m.user.id));
  const addableMembers = members.filter((m: any) => !spaceMemberIds.has(m.id));

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
      toast.success('Project created');
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

  const handleAddMember = async (userId: string) => {
    const member = members.find((m: any) => m.id === userId) as any;
    try {
      await addSpaceMember({
        spaceId: id,
        userId,
        user: member
          ? { id: member.id, name: member.name ?? null, email: member.email, avatar: member.avatar ?? null }
          : undefined,
      }).unwrap();
      toast.success('Member added');
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeSpaceMember({ spaceId: id, userId }).unwrap();
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || 'Failed to remove member');
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
    return <SpaceSkeleton />;
  }

  if (!space) return null;

  const SpaceIcon = getSpaceIcon(space.icon);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <Link
        href={`/organizations/${space.organization?.id || space.organizationId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Organization
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="group flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: space.color + '20' }}>
            <SpaceIcon className="w-4 h-4" style={{ color: space.color }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">{space.name}</h1>
          {!isGuest && (
            <button
              onClick={openEditDialog}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              title="Edit space"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isGuest && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete space?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deletes {space.name} and all its projects and tasks.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSpace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!isGuest && (
            <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New project</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }} className="space-y-3 mt-2">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" required autoFocus />
                  <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Description (optional)" rows={3} />
                  <Button type="submit" className="w-full" disabled={isCreatingProject}>
                    {isCreatingProject ? 'Creating…' : 'Create'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {space.description && (
        <p className="text-sm text-muted-foreground mb-5 max-w-2xl">{space.description}</p>
      )}

      {/* Compact member strip */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Members</span>
        <div className="flex -space-x-1.5">
          {spaceMembers.slice(0, 6).map((m: any) => (
            <Avatar key={m.user.id} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {spaceMembers.length > 6 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
              +{spaceMembers.length - 6}
            </div>
          )}
          {spaceMembers.length === 0 && (
            <span className="text-xs text-muted-foreground ml-1">None</span>
          )}
        </div>
        {isAdmin && (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setManageMembersOpen(true)}>
            <UserPlus className="w-3 h-3" />
            Manage
          </Button>
        )}
      </div>

      {/* Edit Space Dialog */}
      {!isGuest && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit space</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSpace} className="space-y-3 mt-2">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" required maxLength={100} />
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description (optional)" rows={3} maxLength={500} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {SPACE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${editColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {SPACE_ICONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setEditIcon(item.value)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center border-2 transition-colors ${
                          editIcon === item.value ? 'border-foreground bg-muted' : 'border-transparent hover:bg-muted/50'
                        }`}
                        title={item.label}
                      >
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isUpdatingSpace || !editName.trim()}>
                {isUpdatingSpace ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Manage members dialog */}
      {isAdmin && (
        <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Space members</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">In space · {spaceMembers.length}</div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border rounded-md border border-border">
                  {spaceMembers.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">None yet</p>}
                  {spaceMembers.map((m: any) => (
                    <div key={m.user.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{m.user.name || m.user.email}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{m.user.email}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveMember(m.user.id)} className="text-xs text-destructive hover:underline shrink-0">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Available · {addableMembers.length}</div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border rounded-md border border-border">
                  {addableMembers.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">All members already added</p>}
                  {addableMembers.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {(m.name?.[0] || m.email[0]).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{m.name || m.email}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {m.email} · {m.role.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(m.id)}
                        disabled={isAddingMember}
                        className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Projects grid */}
      {space.projects && space.projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {space.projects.map((project: any) => (
            <div key={project.id} className="relative group">
              <Link href={`/projects/${project.id}`}>
                <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-secondary/20 transition-colors h-full">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary mb-1 pr-7 truncate">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground tabular-nums">{project._count?.tasks || 0} tasks</p>
                </div>
              </Link>
              {!isGuest && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Deletes {project.name} and all its tasks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-3">No projects yet</p>
          {!isGuest && (
            <Button size="sm" onClick={() => setNewProjectOpen(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SpaceSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="flex items-center gap-2.5 mb-5">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-8 w-full mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
    </div>
  );
}
