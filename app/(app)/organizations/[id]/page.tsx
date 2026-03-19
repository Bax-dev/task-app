'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, FolderOpen, Loader2, Mail, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { useGetOrganizationQuery, useGetOrgSpacesQuery, useGetOrgMembersQuery, useCreateSpaceMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

export default function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');

  const { data: org, isLoading } = useGetOrganizationQuery(id);

  const { data: spaces = [] } = useGetOrgSpacesQuery(id, { skip: !id });

  const { data: members = [] } = useGetOrgMembersQuery(id, { skip: !id });

  const [createSpace, { isLoading: isCreatingSpace }] = useCreateSpaceMutation();

  const handleCreateSpace = async () => {
    try {
      await createSpace({ name: spaceName, color: spaceColor, organizationId: id }).unwrap();
      toast.success('Space created!');
      setNewSpaceOpen(false);
      setSpaceName('');
      setSpaceColor('#7c3aed');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create space');
    }
  };

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN';
  const isGuest = currentUserRole === 'GUEST';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{org.name}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Manage spaces, projects, and team members</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href={`/organizations/${id}/invite`}>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Invite
              </Button>
            </Link>
          )}
          {!isGuest && (
          <Dialog open={newSpaceOpen} onOpenChange={setNewSpaceOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Space
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Space in {org.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateSpace(); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Space Name</Label>
                  <Input value={spaceName} onChange={(e) => setSpaceName(e.target.value)} placeholder="e.g. Sales, Marketing, Software" required />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {SPACE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSpaceColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${spaceColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isCreatingSpace}>
                  {isCreatingSpace ? 'Creating...' : 'Create Space'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Spaces</p>
              <p className="text-3xl font-bold text-foreground mt-1">{spaces.length}</p>
            </div>
            <Layout className="w-10 h-10 text-primary/20" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Members</p>
              <p className="text-3xl font-bold text-foreground mt-1">{members.length}</p>
            </div>
            <Users className="w-10 h-10 text-primary/20" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div>
            <p className="text-muted-foreground text-sm">Slug</p>
            <p className="text-lg font-mono font-bold text-foreground mt-1">{org.slug}</p>
          </div>
        </div>
      </div>

      {/* Members */}
      {members.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Team Members</h2>
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member: any) => (
                  <tr key={member.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{member.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        member.role === 'ADMIN' ? 'bg-primary/10 text-primary' : member.role === 'GUEST' ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spaces */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Spaces</h2>
        {spaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space: any) => (
              <Link key={space.id} href={`/spaces/${space.id}`} className="group">
                <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: space.color + '20' }}>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: space.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {space.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {space._count?.projects || 0} projects
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No spaces yet</h3>
            <p className="text-muted-foreground mb-4">Create spaces to organize your projects</p>
            {!isGuest && (
              <Button onClick={() => setNewSpaceOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Space
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
