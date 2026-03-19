'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2, Trash2, Building2 } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useViewStore } from '@/stores/view-store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
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

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const view = useViewStore((s) => s.getView('organizations'));
  const setView = useViewStore((s) => s.setView);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<any[]>('/api/organizations'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-2">Manage all your organizations and teams</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={(v) => setView('organizations', v)} />
          <Link href="/organizations/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Organization
            </Button>
          </Link>
        </div>
      </div>

      {organizations.length > 0 ? (
        view === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org: any) => (
              <OrgCard key={org.id} org={org} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Spaces</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Members</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org: any) => (
                  <tr key={org.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/organizations/${org.id}`} className="font-medium text-primary hover:underline">
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{org.slug}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{org._count?.spaces || 0}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{org._count?.memberships || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/organizations/${org.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{org.name}&quot; and all its data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(org.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No organizations yet</h3>
          <p className="text-muted-foreground mb-4">Create your first organization to get started</p>
          <Link href="/organizations/new">
            <Button>Create Organization</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function OrgCard({ org, onDelete }: { org: any; onDelete: (id: string) => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <Link href={`/organizations/${org.id}`} className="flex-1">
          <h3 className="text-lg font-bold text-primary hover:underline">{org.name}</h3>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{org.name}&quot; and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(org.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{org._count?.memberships || 0} members</span>
        </div>
        <p className="text-sm text-muted-foreground">{org._count?.spaces || 0} spaces</p>
      </div>
      <Link href={`/organizations/${org.id}`}>
        <Button variant="outline" size="sm" className="w-full">View</Button>
      </Link>
    </div>
  );
}
