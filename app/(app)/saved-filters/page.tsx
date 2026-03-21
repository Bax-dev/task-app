'use client';

import { useState, useEffect } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useGetOrganizationsQuery,
  useGetOrgSavedFiltersQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import SavedFilterCreate from '@/components/saved-filters/savedFilterCreate';
import SavedFilterEdit from '@/components/saved-filters/savedFilterEdit';
import SavedFilterRemove from '@/components/saved-filters/savedFilterRemove';
import SavedFilterRead from '@/components/saved-filters/savedFilterRead';

export default function SavedFiltersPage() {
  const { user: currentUser } = useAuth();

  // Org selection
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: savedFilters = [], isLoading: filtersLoading } = useGetOrgSavedFiltersQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  // Active filter selection
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createQuery, setCreateQuery] = useState<{ status: string[]; priority: string[]; dueDate: string }>({ status: [], priority: [], dueDate: '' });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFilter, setEditFilter] = useState<{ id: string; name: string; shared: boolean; query: any } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFilter, setDeleteFilter] = useState<{ id: string; name: string } | null>(null);

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const clearAll = () => {
    setActiveFilterId(null);
  };

  const handleSaveFilter = (query: { status: string[]; priority: string[]; dueDate: string }) => {
    setCreateQuery(query);
    setCreateDialogOpen(true);
  };

  const handleEditFilter = (filter: any) => {
    setEditFilter({ id: filter.id, name: filter.name, shared: filter.shared, query: filter.query });
    setEditDialogOpen(true);
  };

  const handleDeleteFilter = (filter: any) => {
    setDeleteFilter({ id: filter.id, name: filter.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleted = () => {
    if (deleteFilter && activeFilterId === deleteFilter.id) {
      clearAll();
    }
  };

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization';

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Saved Filters</h1>
          <p className="text-muted-foreground mt-1 text-sm">Build queries and preview matching tasks in real-time</p>
        </div>
        <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v); clearAll(); }}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedOrg ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to get started</p>
        </div>
      ) : (
        <SavedFilterRead
          filters={savedFilters}
          isLoading={filtersLoading}
          selectedFilterId={activeFilterId}
          onSelectFilter={setActiveFilterId}
          onEditFilter={handleEditFilter}
          onDeleteFilter={handleDeleteFilter}
          onSaveFilter={handleSaveFilter}
          isGuest={isGuest}
        />
      )}

      {/* Create Dialog */}
      <SavedFilterCreate
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={selectedOrg}
        organizationName={selectedOrgName}
        currentQuery={createQuery}
      />

      {/* Edit Dialog */}
      {editFilter && (
        <SavedFilterEdit
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          filter={editFilter}
        />
      )}

      {/* Delete Dialog */}
      {deleteFilter && (
        <SavedFilterRemove
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          filter={deleteFilter}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
