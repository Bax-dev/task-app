'use client';

import { useState } from 'react';
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
import { FolderOpen, Loader2, Plus, Search, CheckSquare, ArrowRight } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, selectView } from '@/store/slices/viewSlice';
import { toast } from 'sonner';
import { useGetProjectsQuery, useGetOrganizationsQuery, useGetOrgSpacesQuery, useCreateProjectMutation } from '@/store/api';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView('projects'));
  const [selectedOrg, setSelectedOrg] = useState('');

  const { data: projects = [], isLoading } = useGetProjectsQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();
  const { data: spaces = [] } = useGetOrgSpacesQuery(selectedOrg, { skip: !selectedOrg });
  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();

  const handleCreateProject = async () => {
    try {
      await createProject({ name, description: description || undefined, spaceId }).unwrap();
      toast.success('Project created!');
      setOpen(false);
      setName('');
      setDescription('');
      setSpaceId('');
      setSelectedOrg('');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create project');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = projects.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.space?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.space?.organization?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by organization for grid view
  const groupedByOrg = filtered.reduce<Record<string, { orgName: string; projects: any[] }>>((acc, p: any) => {
    const orgName = p.space?.organization?.name || 'Other';
    const orgId = p.space?.organization?.id || 'other';
    if (!acc[orgId]) acc[orgId] = { orgName, projects: [] };
    acc[orgId].projects.push(p);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''} across your organizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={(v) => dispatch(setView({ page: 'projects', mode: v }))} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}
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
                    disabled={isCreatingProject}
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
                    disabled={isCreatingProject}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreatingProject || !spaceId}>
                  {isCreatingProject ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, space, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>
      )}

      {/* Content */}
      {filtered.length > 0 ? (
        view === 'grid' ? (
          <div className="space-y-8">
            {Object.entries(groupedByOrg).map(([orgId, { orgName, projects: orgProjects }]) => (
              <div key={orgId}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {orgName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {orgProjects.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="group">
                      <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 hover:shadow-sm transition-all h-full">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {project.name}
                          </h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-auto">
                          {project.space && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: project.space.color }} />
                              {project.space.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <CheckSquare className="w-3 h-3" />
                            {project._count?.tasks || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-border bg-secondary/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Space</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project: any) => (
                  <tr key={project.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}`} className="block">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {project.space?.name && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: project.space.color }} />
                          {project.space.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{project.space?.organization?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-center">{project._count?.tasks || 0}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : projects.length > 0 ? (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No projects match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Projects live inside spaces. Create an organization and space first, then add your first project.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {organizations.length > 0 ? (
                <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </Button>
              ) : (
                <Link href="/organizations/new">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Create Organization
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
