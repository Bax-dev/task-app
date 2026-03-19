'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch invitation details (public, no auth needed)
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitations', token],
    queryFn: () => api.get<any>(`/api/invitations/${token}`),
  });

  // Check if user is logged in
  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<any>('/api/auth/me'),
    retry: false,
  });

  const isLoggedIn = !!user;

  const acceptMutation = useMutation({
    mutationFn: () => api.post('/api/invitations/accept', { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Invitation accepted! Welcome to the organization.');
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      if (error.status === 401) {
        toast.error('Please log in first to accept this invitation.');
      } else {
        toast.error(error.message);
      }
    },
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-4">
            This invitation link is invalid or has expired.
          </p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAccepted = invitation.status === 'ACCEPTED';

  if (isExpired || isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {isAccepted ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isAccepted ? 'Already Accepted' : 'Invitation Expired'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isAccepted
              ? 'This invitation has already been accepted.'
              : 'This invitation has expired. Please ask for a new one.'}
          </p>
          <Button onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}>
            {isLoggedIn ? 'Go to Dashboard' : 'Go to Login'}
          </Button>
        </div>
      </div>
    );
  }

  const inviteUrl = `/invite/${token}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary">
      <div className="bg-card rounded-lg border border-border shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-primary">
            {invitation.organization?.name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;re Invited!
        </h1>
        <p className="text-muted-foreground mb-6">
          You&apos;ve been invited to join{' '}
          <strong className="text-foreground">{invitation.organization?.name}</strong>
        </p>

        <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-sm text-muted-foreground text-left space-y-1">
          <p>Invited as: <strong className="text-foreground">{invitation.role || 'Member'}</strong></p>
          <p>Email: <strong className="text-foreground">{invitation.email}</strong></p>
        </div>

        {isLoggedIn ? (
          /* User is logged in - show accept button */
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="w-full"
            size="lg"
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        ) : (
          /* User is NOT logged in - show login/signup options */
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              You need an account to join. Log in or create one below.
            </p>

            <Link href={`/login?redirect=${encodeURIComponent(inviteUrl)}`}>
              <Button variant="default" className="w-full gap-2" size="lg">
                <LogIn className="w-4 h-4" />
                Log In &amp; Accept
              </Button>
            </Link>

            <Link href={`/signup?redirect=${encodeURIComponent(inviteUrl)}`}>
              <Button variant="outline" className="w-full gap-2" size="lg">
                <UserPlus className="w-4 h-4" />
                Create Account &amp; Accept
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
