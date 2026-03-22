'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutDashboard, Loader2 } from 'lucide-react';
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
  useGetOrgDashboardsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import DashboardCreate from '@/components/dashboards/dashboardCreate';
import DashboardEdit from '@/components/dashboards/dashboardEdit';
import DashboardRemove from '@/components/dashboards/dashboardRemove';
import DashboardRead from '@/components/dashboards/dashboardRead';

export default function DashboardsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [newDashboardOpen, setNewDashboardOpen] = useState(false);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<{ id: string; name: string } | null>(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDashboard, setDeleteDashboard] = useState<{ id: string; name: string } | null>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: dashboards = [], isLoading: dashboardsLoading } = useGetOrgDashboardsQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  const selectedOrgName = useMemo(
    () => organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization',
    [organizations, selectedOrg]
  );

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const handleEditDashboard = (dashboard: any) => {
    setEditDashboard({ id: dashboard.id, name: dashboard.name });
    setEditOpen(true);
  };

  const handleDeleteDashboard = (dashboard: any) => {
    setDeleteDashboard({ id: dashboard.id, name: dashboard.name });
    setDeleteOpen(true);
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open && deleteDashboard && activeDashboardId === deleteDashboard.id) {
      setActiveDashboardId(null);
    }
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
      {/* Header - only show when not viewing a specific dashboard */}
      {!activeDashboardId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboards</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Create personalized views of your work</p>
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
              <DashboardCreate
                open={newDashboardOpen}
                onOpenChange={setNewDashboardOpen}
                organizationId={selectedOrg}
                organizationName={selectedOrgName}
              />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!selectedOrg ? (
        <div className="text-center py-12">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view dashboards</p>
        </div>
      ) : (
        <DashboardRead
          dashboards={dashboards}
          isLoading={dashboardsLoading}
          selectedDashboardId={activeDashboardId}
          onSelectDashboard={setActiveDashboardId}
          onEditDashboard={handleEditDashboard}
          onDeleteDashboard={handleDeleteDashboard}
          isGuest={isGuest}
        />
      )}

      {/* Edit Dialog */}
      {editDashboard && (
        <DashboardEdit
          open={editOpen}
          onOpenChange={setEditOpen}
          dashboard={editDashboard}
        />
      )}

      {/* Delete Dialog */}
      {deleteDashboard && (
        <DashboardRemove
          open={deleteOpen}
          onOpenChange={handleDeleteOpenChange}
          dashboard={deleteDashboard}
        />
      )}
    </div>
  );
}
