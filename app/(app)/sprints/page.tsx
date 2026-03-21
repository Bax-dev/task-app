'use client';

import { useState } from 'react';
import { Plus, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetOrganizationsQuery,
  useGetOrgSprintsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import SprintCreate from '@/components/sprints/sprintCreate';
import SprintEdit from '@/components/sprints/sprintEdit';
import SprintRemove from '@/components/sprints/sprintRemove';
import SprintRead from '@/components/sprints/sprintRead';

export default function SprintsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sprintToEdit, setSprintToEdit] = useState<any>(null);
  const [sprintToDelete, setSprintToDelete] = useState<any>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: sprints = [], isLoading: sprintsLoading } = useGetOrgSprintsQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  // Auto-select first org
  if (organizations.length > 0 && !selectedOrg) {
    setSelectedOrg(organizations[0].id);
  }

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization';

  // Loading state
  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ------- Sprint Detail View -------
  if (selectedSprintId) {
    return (
      <SprintRead
        sprints={sprints}
        isLoading={sprintsLoading}
        selectedSprintId={selectedSprintId}
        onSelectSprint={setSelectedSprintId}
        onEditSprint={(sprint) => {
          setSprintToEdit(sprint);
          setEditDialogOpen(true);
        }}
        onDeleteSprint={(sprint) => {
          setSprintToDelete(sprint);
          setDeleteDialogOpen(true);
        }}
        isGuest={isGuest}
      />
    );
  }

  // ------- Sprint List View -------
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sprints</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Plan and track your team&apos;s velocity
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrg && !isGuest && (
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              New Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view sprints</p>
        </div>
      ) : (
        <>
          <SprintRead
            sprints={sprints}
            isLoading={sprintsLoading}
            selectedSprintId={null}
            onSelectSprint={setSelectedSprintId}
            onEditSprint={(sprint) => {
              setSprintToEdit(sprint);
              setEditDialogOpen(true);
            }}
            onDeleteSprint={(sprint) => {
              setSprintToDelete(sprint);
              setDeleteDialogOpen(true);
            }}
            isGuest={isGuest}
          />

          {sprints.length === 0 && !sprintsLoading && !isGuest && (
            <div className="flex justify-center">
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Sprint
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      {selectedOrg && (
        <SprintCreate
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          organizationId={selectedOrg}
          organizationName={selectedOrgName}
        />
      )}

      {sprintToEdit && (
        <SprintEdit
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSprintToEdit(null);
          }}
          sprint={sprintToEdit}
        />
      )}

      {sprintToDelete && (
        <SprintRemove
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setSprintToDelete(null);
          }}
          sprint={sprintToDelete}
        />
      )}
    </div>
  );
}
