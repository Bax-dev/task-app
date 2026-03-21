'use client';

import { useState } from 'react';
import { Plus, Loader2, Plug } from 'lucide-react';
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
  useGetOrgIntegrationsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import IntegrationCreate from '@/components/integrations/integrationCreate';
import IntegrationEdit from '@/components/integrations/integrationEdit';
import IntegrationRemove from '@/components/integrations/integrationRemove';
import IntegrationRead from '@/components/integrations/integrationRead';

export default function IntegrationsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [prefilledType, setPrefilledType] = useState<string | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIntegration, setDeletingIntegration] = useState<any>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: integrations = [], isLoading: integrationsLoading } = useGetOrgIntegrationsQuery(
    selectedOrg,
    { skip: !selectedOrg }
  );
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'OWNER';

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || '';

  const handleAddPlatform = (type: string) => {
    setPrefilledType(type || undefined);
    setCreateDialogOpen(true);
  };

  const handleEditIntegration = (integration: any) => {
    setEditingIntegration(integration);
    setEditDialogOpen(true);
  };

  const handleDeleteIntegration = (integration: any) => {
    setDeletingIntegration(integration);
    setDeleteDialogOpen(true);
  };

  // Auto-select first org
  if (organizations.length > 0 && !selectedOrg) {
    setSelectedOrg(organizations[0].id);
  }

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Plug className="w-7 h-7 text-primary" />
            Integrations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Connect your favorite tools and services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrg && isAdmin && (
            <Button className="gap-2" onClick={() => handleAddPlatform('')}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      </div>

      {!selectedOrg ? (
        <div className="text-center py-16">
          <Plug className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view integrations</p>
        </div>
      ) : (
        <IntegrationRead
          integrations={integrations}
          isLoading={integrationsLoading}
          onEditIntegration={handleEditIntegration}
          onDeleteIntegration={handleDeleteIntegration}
          onAddPlatform={handleAddPlatform}
          isAdmin={isAdmin}
          organizationName={selectedOrgName}
        />
      )}

      {/* Create Dialog */}
      <IntegrationCreate
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={selectedOrg}
        organizationName={selectedOrgName}
        prefilledType={prefilledType}
      />

      {/* Edit Dialog */}
      {editingIntegration && (
        <IntegrationEdit
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingIntegration(null);
          }}
          integration={editingIntegration}
        />
      )}

      {/* Delete Dialog */}
      {deletingIntegration && (
        <IntegrationRemove
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeletingIntegration(null);
          }}
          integration={deletingIntegration}
        />
      )}
    </div>
  );
}
