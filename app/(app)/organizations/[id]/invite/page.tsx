'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { ArrowLeft, UserPlus, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';

export default function AddMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orgId } = use(params);
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const { data: org } = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => api.get<any>(`/api/organizations/${orgId}`),
  });

  // Direct add member (existing user)
  const addMutation = useMutation({
    mutationFn: () =>
      api.post('/api/organizations/' + orgId + '/members/add', {
        email,
        organizationId: orgId,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
      setAddSuccess(email);
      setEmail('');
      toast.success('Member added to the organization!');
    },
    onError: (error: ApiError) => {
      if (error.status === 404) {
        toast.error('No account found with this email. Use the "Send Invitation" tab instead.');
      } else {
        toast.error(error.message);
      }
    },
  });

  // Send invitation (new user)
  const inviteMutation = useMutation({
    mutationFn: () =>
      api.post('/api/invitations', {
        email,
        organizationId: orgId,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href={`/organizations/${orgId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {org?.name || 'Organization'}
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">Add Team Member</h1>
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
          <div className="bg-card border border-border rounded-lg p-6 mt-4">
            <h3 className="font-semibold text-foreground mb-1">Add existing user</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The person must already have a TaskFlow account. They&apos;ll be added instantly.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-email">Email Address</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={addMutation.isPending}
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

              <Button type="submit" className="w-full gap-2" disabled={addMutation.isPending}>
                <UserPlus className="w-4 h-4" />
                {addMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Tab 2: Send invitation */}
        <TabsContent value="invite">
          <div className="bg-card border border-border rounded-lg p-6 mt-4">
            <h3 className="font-semibold text-foreground mb-1">Invite via email</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Send an invitation link. They can sign up and join the organization.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="newcolleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={inviteMutation.isPending}
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

              <Button type="submit" className="w-full gap-2" disabled={inviteMutation.isPending}>
                <Mail className="w-4 h-4" />
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
