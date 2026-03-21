'use client';

import { useState } from 'react';
import { Plus, LayoutGrid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useGetOrganizationsQuery, useGetProjectBoardsQuery,
  useGetOrgSpacesQuery, useGetSpaceProjectsQuery, useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import BoardCreate from '@/components/boards/boardCreate';
import BoardEdit from '@/components/boards/boardEdit';
import BoardRemove from '@/components/boards/boardRemove';
import BoardRead from '@/components/boards/boardRead';

export default function BoardsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [removingBoard, setRemovingBoard] = useState<{ id: string; name: string } | null>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: spaces = [] } = useGetOrgSpacesQuery(selectedOrg, { skip: !selectedOrg });
  const { data: projects = [] } = useGetSpaceProjectsQuery(selectedSpace, { skip: !selectedSpace });
  const { data: boards = [], isLoading: boardsLoading } = useGetProjectBoardsQuery(selectedProject, { skip: !selectedProject });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  // Auto-select first org/space/project
  if (organizations.length > 0 && !selectedOrg) {
    setSelectedOrg(organizations[0].id);
  }
  if (spaces.length > 0 && !selectedSpace) {
    setSelectedSpace(spaces[0].id);
  }
  if (projects.length > 0 && !selectedProject) {
    setSelectedProject(projects[0].id);
  }

  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId);
    setSelectedSpace('');
    setSelectedProject('');
    setSelectedBoardId(null);
  };

  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpace(spaceId);
    setSelectedProject('');
    setSelectedBoardId(null);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedBoardId(null);
  };

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      {!selectedBoardId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Boards</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Kanban boards for project task management
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedOrg} onValueChange={handleOrgChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOrg && (
              <Select value={selectedSpace} onValueChange={handleSpaceChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Space" />
                </SelectTrigger>
                <SelectContent>
                  {spaces.map((space: any) => (
                    <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedSpace && (
              <Select value={selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedProject && !isGuest && (
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                New Board
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!selectedProject ? (
        <div className="text-center py-16">
          <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization, space, and project to view boards</p>
        </div>
      ) : (
        <BoardRead
          boards={boards}
          isLoading={boardsLoading}
          selectedBoardId={selectedBoardId}
          onSelectBoard={setSelectedBoardId}
          onEditBoard={(board) => { setEditingBoard(board); setEditOpen(true); }}
          onDeleteBoard={(board) => { setRemovingBoard(board); setRemoveOpen(true); }}
          isGuest={isGuest}
        />
      )}

      {/* Dialogs */}
      <BoardCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={selectedProject}
        projectName={projects.find((p: any) => p.id === selectedProject)?.name || 'Project'}
      />
      {editingBoard && (
        <BoardEdit
          open={editOpen}
          onOpenChange={setEditOpen}
          board={editingBoard}
        />
      )}
      {removingBoard && (
        <BoardRemove
          open={removeOpen}
          onOpenChange={setRemoveOpen}
          board={removingBoard}
        />
      )}
    </div>
  );
}
