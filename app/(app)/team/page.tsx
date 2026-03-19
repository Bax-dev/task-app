'use client';

import { useState } from 'react';
import { Users, Loader2, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useGetOrganizationsQuery, useGetOrgMembersQuery, useGetOrgInvitationsQuery, useRemoveOrgMemberMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function TeamPage() {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const { user } = useAuth();

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();

  const { data: members = [], isLoading: membersLoading } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });

  const { data: invitations = [] } = useGetOrgInvitationsQuery(selectedOrg, { skip: !selectedOrg });

  const [removeOrgMember] = useRemoveOrgMemberMutation();

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeOrgMember({ orgId: selectedOrg, userId: memberId }).unwrap();
      toast.success('Member removed successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to remove member');
    }
  };

  const selectedOrgData = organizations.find((org: any) => org.id === selectedOrg);
  const currentUserRole = members.find((m: any) => m.id === user?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN';

  const canRemoveMember = (member: any) => {
    if (!user || !isAdmin) return false;
    // Cannot remove yourself
    if (member.id === user.id) return false;
    // Cannot remove the org creator
    if (selectedOrgData && member.id === selectedOrgData.createdById) return false;
    return true;
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-2">Manage your organization members</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrg && isAdmin && (
            <Link href={`/organizations/${selectedOrg}/invite`}>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Invite Member
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!selectedOrg ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select an organization to view members</p>
        </div>
      ) : membersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Members Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Members ({members.length})
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member: any) => (
                    <tr key={member.id} className="border-b border-border">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {(member.name?.[0] || member.email[0]).toUpperCase()}
                            </span>
                          </div>
                          {member.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          member.role === 'ADMIN' ? 'bg-primary/10 text-primary' : member.role === 'GUEST' ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canRemoveMember(member) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name || member.email} from
                                  this organization? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-muted-foreground text-background hover:bg-muted-foreground/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations */}
          {(() => {
            const pendingInvitations = invitations.filter((i: any) => i.status === 'PENDING');
            return pendingInvitations.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Pending Invitations ({pendingInvitations.length})
                </h2>
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvitations.map((inv: any) => (
                        <tr key={inv.id} className="border-b border-border">
                          <td className="px-6 py-4 text-sm text-foreground">{inv.email}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{inv.role}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-600">
                              PENDING
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null;
          })()}
        </>
      )}
    </div>
  );
}
