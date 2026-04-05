'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useGetInvitationByTokenQuery, useAcceptInvitationMutation } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch invitation details (public, no auth needed)
  const { data: invitation, isLoading, error } = useGetInvitationByTokenQuery(token);

  const isLoggedIn = !!user;

  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const autoAcceptAttempted = useRef(false);

  // Auto-accept: when user is logged in and invitation is valid, accept automatically
  useEffect(() => {
    if (
      isLoggedIn &&
      invitation &&
      invitation.status === 'PENDING' &&
      new Date(invitation.expiresAt) > new Date() &&
      !autoAcceptAttempted.current
    ) {
      autoAcceptAttempted.current = true;
      acceptInvitation(token)
        .unwrap()
        .then(() => {
          toast.success('Invitation accepted! Welcome to the organization.');
          router.push('/dashboard');
        })
        .catch((err: any) => {
          const msg = err?.data?.message || err?.message || 'Failed to accept invitation';
          if (err?.status === 401) {
            setAcceptError('Please log in first to accept this invitation.');
          } else {
            setAcceptError(msg);
          }
        });
    }
  }, [isLoggedIn, invitation, token, acceptInvitation, router]);

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

  // Logged-in user: show auto-accepting state or error
  if (isLoggedIn) {
    if (acceptError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Could Not Join</h1>
            <p className="text-muted-foreground mb-4">{acceptError}</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      );
    }

    // Auto-accepting in progress
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Joining {invitation.organization?.name}...</h1>
          <p className="text-muted-foreground">Please wait while we add you to the organization.</p>
        </div>
      </div>
    );
  }

  // Not logged in — show login/signup options
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

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            You need an account to join. Log in or create one below.
          </p>

          <Button
            variant="default"
            className="w-full gap-2"
            size="lg"
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(invitation.email)}`)}
          >
            <LogIn className="w-4 h-4" />
            Log In &amp; Accept
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            size="lg"
            onClick={() => router.push(`/signup?redirect=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(invitation.email)}`)}
          >
            <UserPlus className="w-4 h-4" />
            Create Account &amp; Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
