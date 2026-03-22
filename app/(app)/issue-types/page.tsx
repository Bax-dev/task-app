'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useGetOrganizationsQuery, useGetOrgIssueTypesQuery, useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import IssueTypeCreate from '@/components/issue-types/issueTypeCreate';
import IssueTypeEdit from '@/components/issue-types/issueTypeEdit';
import IssueTypeRemove from '@/components/issue-types/issueTypeRemove';
import IssueTypeRead from '@/components/issue-types/issueTypeRead';

export default function IssueTypesPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [editIssueType, setEditIssueType] = useState<any | null>(null);
  const [deleteIssueType, setDeleteIssueType] = useState<any | null>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: issueTypes = [], isLoading: issueTypesLoading } = useGetOrgIssueTypesQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization';

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Issue Types</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Configure issue types and custom fields for your organization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v); setSelectedTypeId(null); }}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrg && isAdmin && (
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Issue Type
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view issue types</p>
        </div>
      ) : (
        <IssueTypeRead
          issueTypes={issueTypes}
          isLoading={issueTypesLoading}
          selectedIssueTypeId={selectedTypeId}
          onSelectIssueType={setSelectedTypeId}
          onEditIssueType={setEditIssueType}
          onDeleteIssueType={setDeleteIssueType}
          organizationId={selectedOrg}
          isAdmin={isAdmin}
        />
      )}

      {/* Create Dialog */}
      <IssueTypeCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={selectedOrg}
        organizationName={selectedOrgName}
      />

      {/* Edit Dialog */}
      {editIssueType && (
        <IssueTypeEdit
          open={!!editIssueType}
          onOpenChange={(open) => { if (!open) setEditIssueType(null); }}
          issueType={editIssueType}
        />
      )}

      {/* Delete Dialog */}
      {deleteIssueType && (
        <IssueTypeRemove
          open={!!deleteIssueType}
          onOpenChange={(open) => {
            if (!open) {
              if (selectedTypeId === deleteIssueType.id) setSelectedTypeId(null);
              setDeleteIssueType(null);
            }
          }}
          issueType={deleteIssueType}
        />
      )}
    </div>
  );
}
