'use client';

import { useState, useEffect } from 'react';
import { Plus, Zap, Loader2 } from 'lucide-react';
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
  useGetOrgAutomationsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import AutomationCreate from '@/components/automations/automationCreate';
import AutomationEdit from '@/components/automations/automationEdit';
import AutomationRemove from '@/components/automations/automationRemove';
import AutomationRead from '@/components/automations/automationRead';

export default function AutomationsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();

  const { data: automations = [], isLoading: automationsLoading } = useGetOrgAutomationsQuery(
    selectedOrg,
    { skip: !selectedOrg },
  );

  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization';

  // Loading state
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            No-code automation rules for your workflow
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
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Automation
            </Button>
          )}
        </div>
      </div>

      {/* No org selected */}
      {!selectedOrg ? (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view automations</p>
        </div>
      ) : automationsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No automations yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first automation to streamline your workflow
          </p>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Automation
            </Button>
          )}
        </div>
      ) : (
        <AutomationRead
          automations={automations}
          isLoading={automationsLoading}
          isAdmin={isAdmin}
          onEditAutomation={(automation) => setEditTarget(automation)}
          onDeleteAutomation={(automation) => setDeleteTarget(automation)}
        />
      )}

      {/* Create dialog */}
      {selectedOrg && (
        <AutomationCreate
          open={createOpen}
          onOpenChange={setCreateOpen}
          organizationId={selectedOrg}
          organizationName={selectedOrgName}
        />
      )}

      {/* Edit dialog */}
      {editTarget && (
        <AutomationEdit
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          automation={editTarget}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <AutomationRemove
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          automation={deleteTarget}
        />
      )}
    </div>
  );
}
