'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2, Trash2, Building2 } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, selectView } from '@/store/slices/viewSlice';
import { useGetOrganizationsQuery, useDeleteOrganizationMutation } from '@/store/api';
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
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView('organizations'));

  const { data: organizations = [], isLoading } = useGetOrganizationsQuery();

  const [deleteOrganization] = useDeleteOrganizationMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteOrganization(id).unwrap();
      toast.success('Organization deleted');
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

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Manage all your organizations and teams</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={(v) => dispatch(setView({ page: 'organizations', mode: v }))} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org: any) => (
              <OrgCard key={org.id} org={org} onDelete={(id) => handleDelete(id)} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px]">
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
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
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
                              <AlertDialogAction onClick={() => handleDelete(org.id)} className="bg-muted-foreground text-background hover:bg-muted-foreground/90">
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
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <Link href={`/organizations/${org.id}`} className="flex-1">
          <h3 className="text-lg font-bold text-primary hover:underline">{org.name}</h3>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
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
              <AlertDialogAction onClick={() => onDelete(org.id)} className="bg-muted-foreground text-background hover:bg-muted-foreground/90">
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
