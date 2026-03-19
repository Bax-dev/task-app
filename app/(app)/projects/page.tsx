'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { FolderOpen, Loader2, Plus } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useViewStore } from '@/stores/view-store';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const view = useViewStore((s) => s.getView('projects'));
  const setViewMode = useViewStore((s) => s.setView);
  const [selectedOrg, setSelectedOrg] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<any[]>('/api/projects'),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<any[]>('/api/organizations'),
  });

  const { data: spaces = [] } = useQuery({
    queryKey: ['organizations', selectedOrg, 'spaces'],
    queryFn: () => api.get<any[]>(`/api/organizations/${selectedOrg}/spaces`),
    enabled: !!selectedOrg,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/api/projects', { name, description: description || undefined, spaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Project created!');
      setOpen(false);
      setName('');
      setDescription('');
      setSpaceId('');
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
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">All projects across your organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={(v) => setViewMode('projects', v)} />
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v); setSpaceId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrg && (
                <div className="space-y-2">
                  <Label>Space</Label>
                  <Select value={spaceId} onValueChange={setSpaceId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map((space: any) => (
                        <SelectItem key={space.id} value={space.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: space.color }} />
                            {space.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  required
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">Description (optional)</Label>
                <Textarea
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  rows={3}
                  disabled={createMutation.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || !spaceId}>
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {projects.length > 0 ? (
        view === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group">
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <h3 className="text-lg font-bold text-primary group-hover:underline mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project._count?.tasks || 0} tasks</span>
                    <span>{project.space?.organization?.name || project.space?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Space</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Organization</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Tasks</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: any) => (
                  <tr key={project.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {project.space?.name && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: project.space.color }} />
                          {project.space.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{project.space?.organization?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{project._count?.tasks || 0}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground">Create a project from your organization page</p>
        </div>
      )}
    </div>
  );
}
