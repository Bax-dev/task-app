'use client';

import { useState, useEffect } from 'react';
import { Plus, GitBranch, Loader2, Shield } from 'lucide-react';
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
  useGetOrgWorkflowsQuery,
  useGetOrgMembersQuery,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

import WorkflowCreate from '@/components/workflows/workflowCreate';
import WorkflowEdit from '@/components/workflows/workflowEdit';
import WorkflowRemove from '@/components/workflows/workflowRemove';
import WorkflowRead from '@/components/workflows/workflowRead';

export default function WorkflowsPage() {
  const { user } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<{ id: string; name: string; description: string | null } | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<{ id: string; name: string } | null>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: workflows = [], isLoading: workflowsLoading } = useGetOrgWorkflowsQuery(selectedOrg, { skip: !selectedOrg });
  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const isAdmin = members.some((m: any) => m.id === user?.id && m.role === 'ADMIN');

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const selectedOrgName = organizations.find((o: any) => o.id === selectedOrg)?.name || 'Organization';

  // --- If a workflow is selected, show the editor via WorkflowRead ---
  if (selectedWorkflowId) {
    return (
      <WorkflowRead
        workflows={workflows}
        isLoading={workflowsLoading}
        selectedWorkflowId={selectedWorkflowId}
        onSelectWorkflow={setSelectedWorkflowId}
        onEditWorkflow={(w) => {
          setEditingWorkflow({ id: w.id, name: w.name, description: w.description || null });
          setEditOpen(true);
        }}
        onDeleteWorkflow={(w) => {
          setDeletingWorkflow({ id: w.id, name: w.name });
          setDeleteOpen(true);
        }}
      />
    );
  }

  // --- Loading state ---
  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Admin check ---
  if (selectedOrg && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-muted-foreground text-sm">Workflows are only accessible to organization admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Design custom status flows for your issue types
          </p>
        </div>
        <div className="flex items-center gap-4">
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
          {selectedOrg && (
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view workflows</p>
        </div>
      ) : (
        <>
          <WorkflowRead
            workflows={workflows}
            isLoading={workflowsLoading}
            selectedWorkflowId={selectedWorkflowId}
            onSelectWorkflow={setSelectedWorkflowId}
            onEditWorkflow={(w) => {
              setEditingWorkflow({ id: w.id, name: w.name, description: w.description || null });
              setEditOpen(true);
            }}
            onDeleteWorkflow={(w) => {
              setDeletingWorkflow({ id: w.id, name: w.name });
              setDeleteOpen(true);
            }}
          />

          {/* Empty state "Create" button */}
          {!workflowsLoading && workflows.length === 0 && (
            <div className="flex justify-center">
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Workflow
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      {selectedOrg && (
        <WorkflowCreate
          open={createOpen}
          onOpenChange={setCreateOpen}
          organizationId={selectedOrg}
          organizationName={selectedOrgName}
        />
      )}

      {/* Edit Dialog */}
      {editingWorkflow && (
        <WorkflowEdit
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingWorkflow(null);
          }}
          workflow={editingWorkflow}
        />
      )}

      {/* Delete Dialog */}
      {deletingWorkflow && (
        <WorkflowRemove
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeletingWorkflow(null);
          }}
          workflow={deletingWorkflow}
        />
      )}
    </div>
  );
}
