'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, Mail, CheckCircle, RefreshCw, Loader2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useGetOrganizationQuery,
  useAddOrgMemberMutation,
  useCreateInvitationMutation,
  useGetOrgInvitationsQuery,
  useResendInvitationMutation,
} from '@/store/api';

export default function AddMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orgId } = use(params);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const { data: org } = useGetOrganizationQuery(orgId);
  const { data: pendingInvitations = [], isLoading: invitesLoading } = useGetOrgInvitationsQuery(orgId);

  const [addOrgMember, { isLoading: isAddingMember }] = useAddOrgMemberMutation();
  const [createInvitation, { isLoading: isInviting }] = useCreateInvitationMutation();
  const [resendInvitation] = useResendInvitationMutation();
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleAddMember = async () => {
    try {
      await addOrgMember({ orgId, email, role }).unwrap();
      toast.success(`${email} added to the organization!`);
      router.push('/team');
    } catch (error: any) {
      if (error?.status === 404) {
        toast.error('No account found with this email. Use the "Send Invitation" tab instead.');
      } else {
        toast.error(error?.data?.message || error?.message || 'Failed to add member');
      }
    }
  };

  const handleInvite = async () => {
    try {
      await createInvitation({ email, organizationId: orgId, role }).unwrap();
      toast.success(`Invitation sent to ${email}`);
      router.push('/team');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to send invitation');
    }
  };

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId);
    try {
      await resendInvitation({ invitationId, organizationId: orgId }).unwrap();
      toast.success('Invitation resent!');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to resend');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <Link
        href={`/organizations/${orgId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {org?.name || 'Organization'}
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Add Team Member</h1>
      <p className="text-muted-foreground mb-8">
        Add an existing user directly or send an email invitation
      </p>

      {addSuccess && (
        <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Member added!</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              {addSuccess} can now access this organization
            </p>
          </div>
          <button onClick={() => setAddSuccess(null)} className="ml-auto text-green-600 hover:text-green-800 text-sm">
            Dismiss
          </button>
        </div>
      )}

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Directly
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-2">
            <Mail className="w-4 h-4" />
            Send Invitation
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Add directly */}
        <TabsContent value="add">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mt-4">
            <h3 className="font-semibold text-foreground mb-1">Add existing user</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The person must already have a TaskFlow account. They&apos;ll be added instantly.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-email">Email Address</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAddingMember}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member - Can manage projects &amp; tasks</SelectItem>
                    <SelectItem value="ADMIN">Admin - Full access including member management</SelectItem>
                    <SelectItem value="GUEST">Guest - View only, no add or edit permissions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isAddingMember}>
                <UserPlus className="w-4 h-4" />
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Tab 2: Send invitation */}
        <TabsContent value="invite">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mt-4">
            <h3 className="font-semibold text-foreground mb-1">Invite via email</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Send an invitation link. They can sign up and join the organization.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="newcolleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="GUEST">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isInviting}>
                <Mail className="w-4 h-4" />
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </div>

          {/* Pending Invitations */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Pending Invitations
            </h3>
            {invitesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-2">
                {pendingInvitations.map((inv: any) => {
                  const isExpired = new Date(inv.expiresAt) < new Date();
                  const isResending = resendingId === inv.id;
                  return (
                    <div
                      key={inv.id}
                      className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"
                    >
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
                              <Clock className="w-3 h-3" />
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs flex-shrink-0"
                        onClick={() => handleResend(inv.id)}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        {isResending ? 'Sending...' : 'Resend'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">No pending invitations</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
