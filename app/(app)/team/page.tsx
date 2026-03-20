'use client';

import { useState } from 'react';
import { Users, Loader2, Mail, Trash2, Search, Shield, RefreshCw, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import {
  useGetOrganizationsQuery,
  useGetOrgMembersQuery,
  useGetOrgInvitationsQuery,
  useRemoveOrgMemberMutation,
  useUpdateMemberRoleMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useDeleteOrganizationMutation,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function TeamPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const { user } = useAuth();

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: members = [], isLoading: membersLoading } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });
  const { data: invitations = [] } = useGetOrgInvitationsQuery(selectedOrg, { skip: !selectedOrg });

  const [removeOrgMember] = useRemoveOrgMemberMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [resendInvitation] = useResendInvitationMutation();
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [deleteOrganization] = useDeleteOrganizationMutation();

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const selectedOrgData = organizations.find((org: any) => org.id === selectedOrg);
  const currentUserRole = members.find((m: any) => m.id === user?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN';

  const canRemoveMember = (member: any) => {
    if (!user || !isAdmin) return false;
    if (member.id === user.id) return false;
    if (selectedOrgData && member.id === selectedOrgData.createdById) return false;
    return true;
  };

  const canChangeRole = (member: any) => {
    if (!user || !isAdmin) return false;
    if (member.id === user.id) return false;
    if (selectedOrgData && member.id === selectedOrgData.createdById) return false;
    return true;
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeOrgMember({ orgId: selectedOrg, userId: memberId }).unwrap();
      toast.success('Member removed');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRoleId(memberId);
    try {
      await updateMemberRole({ orgId: selectedOrg, userId: memberId, role: newRole }).unwrap();
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update role');
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      await resendInvitation({ invitationId, organizationId: selectedOrg }).unwrap();
      toast.success('Invitation resent');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to resend');
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId);
    try {
      await revokeInvitation({ invitationId, organizationId: selectedOrg }).unwrap();
      toast.success('Invitation revoked');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to revoke');
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteOrg = async () => {
    try {
      await deleteOrganization(selectedOrg).unwrap();
      toast.success('Organization deleted');
      setSelectedOrg('');
      router.push('/organizations');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to delete organization');
    }
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

  const pendingInvitations = invitations.filter((i: any) => i.status === 'PENDING');

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage members, roles, and invitations</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-full sm:w-[220px]">
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
              <Button size="sm" className="gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Invite
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!selectedOrg ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select an organization to view members</p>
        </div>
      ) : membersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Search */}
          {members.length > 3 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 max-w-sm"
              />
            </div>
          )}

          {/* Members */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Members ({members.length})
            </h2>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {members
                .filter((m: any) =>
                  m.name?.toLowerCase().includes(search.toLowerCase()) ||
                  m.email?.toLowerCase().includes(search.toLowerCase())
                )
                .map((member: any) => {
                  const isCreator = selectedOrgData && member.id === selectedOrgData.createdById;
                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(member.name?.[0] || member.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{member.name || 'No name'}</p>
                          {member.id === user?.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">You</span>
                          )}
                          {isCreator && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Owner</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      {/* Role selector */}
                      {canChangeRole(member) ? (
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                          disabled={changingRoleId === member.id}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="GUEST">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          member.role === 'ADMIN' ? 'bg-primary/10 text-primary' :
                          member.role === 'GUEST' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {member.role}
                        </span>
                      )}

                      {/* Remove */}
                      {canRemoveMember(member) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground flex-shrink-0 h-8 w-8">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove {member.name || member.email} from {selectedOrgData?.name}? They will lose access to all projects and tasks.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveMember(member.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pending Invitations ({pendingInvitations.length})
              </h2>
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {pendingInvitations.map((inv: any) => {
                  const isExpired = new Date(inv.expiresAt) < new Date();
                  return (
                    <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{inv.role?.toLowerCase()}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          {isExpired ? (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Expired
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() => handleResend(inv.id)}
                            disabled={resendingId === inv.id}
                          >
                            {resendingId === inv.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Resend
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-muted-foreground"
                                disabled={revokingId === inv.id}
                              >
                                {revokingId === inv.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Revoke'
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Revoke the invitation to {inv.email}? They will no longer be able to join using this link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRevoke(inv.id)}>
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {isAdmin && selectedOrgData && selectedOrgData.createdById === user?.id && (
            <DeleteOrgSection orgName={selectedOrgData.name} onDelete={handleDeleteOrg} />
          )}
        </>
      )}
    </div>
  );
}

function DeleteOrgSection({ orgName, onDelete }: { orgName: string; onDelete: () => void }) {
  const [confirmName, setConfirmName] = useState('');
  const [open, setOpen] = useState(false);

  const isMatch = confirmName === orgName;

  return (
    <div className="border border-border rounded-lg p-4">
      <h2 className="text-sm font-semibold text-foreground mb-1">Danger Zone</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Permanently delete this organization and all its data (spaces, projects, tasks).
      </p>
      <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmName(''); }}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            Delete Organization
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {orgName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization, all spaces, projects, tasks, and member data. This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-foreground">
              Type <strong>{orgName}</strong> to confirm:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(); setOpen(false); }}
              disabled={!isMatch}
              className={!isMatch ? 'opacity-50 pointer-events-none' : ''}
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
