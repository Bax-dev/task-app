'use client';

import { useState, useEffect } from 'react';
import { Loader2, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetOrganizationsQuery,
  useGetOrgLabelsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import LabelCreate from '@/components/labels/labelCreate';
import LabelEdit from '@/components/labels/labelEdit';
import LabelRemove from '@/components/labels/labelRemove';
import LabelRead from '@/components/labels/labelRead';

export default function LabelsPage() {
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<{ id: string; name: string; color: string }>({ id: '', name: '', color: '' });
  const [deletingLabel, setDeletingLabel] = useState<{ id: string; name: string; color: string }>({ id: '', name: '', color: '' });

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: labels = [], isLoading: labelsLoading } = useGetOrgLabelsQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const currentUserRole = members.find((m: any) => m.id === currentUser?.id)?.role;
  const isGuest = currentUserRole === 'GUEST';

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const handleEditLabel = (label: any) => {
    setEditingLabel({ id: label.id, name: label.name, color: label.color || '#64748b' });
    setEditDialogOpen(true);
  };

  const handleDeleteLabel = (label: any) => {
    setDeletingLabel({ id: label.id, name: label.name, color: label.color || '#64748b' });
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open && deletingLabel.id === selectedLabelId) {
      setSelectedLabelId(null);
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
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Labels</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage labels and track usage across your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v); setSelectedLabelId(null); }}>
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
            <LabelCreate
              open={createOpen}
              onOpenChange={setCreateOpen}
              organizationId={selectedOrg}
              organizationName={selectedOrgName}
            />
          )}
        </div>
      </div>

      {/* Edit Label Dialog */}
      <LabelEdit
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        label={editingLabel}
      />

      {/* Delete Label Dialog */}
      <LabelRemove
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        label={deletingLabel}
      />

      {!selectedOrg ? (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view labels</p>
        </div>
      ) : (
        <LabelRead
          labels={labels}
          isLoading={labelsLoading}
          selectedLabelId={selectedLabelId}
          onSelectLabel={setSelectedLabelId}
          onEditLabel={handleEditLabel}
          onDeleteLabel={handleDeleteLabel}
          isGuest={isGuest}
          onCreateLabel={() => setCreateOpen(true)}
        />
      )}
    </div>
  );
}
