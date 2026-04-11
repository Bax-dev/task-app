'use client';

import { use, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  LogIn,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAcceptInvitationMutation, useGetInvitationByTokenQuery } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: invitation, isLoading, error, refetch } = useGetInvitationByTokenQuery(token);
  const isLoggedIn = !!user;

  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const autoAcceptAttempted = useRef(false);

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
          toast.success(`You joined ${invitation.organization?.name}`);
          router.push('/dashboard');
        })
        .catch((err: any) => {
          const message = err?.data?.message || err?.message || 'Failed to accept invitation';
          if (err?.status === 401) {
            setAcceptError('Please log in first to accept this invitation.');
          } else {
            setAcceptError(message);
          }
        });
    }
  }, [isLoggedIn, invitation, token, acceptInvitation, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <StateCard
        icon={<XCircle className="h-14 w-14 text-destructive" />}
        title="Invalid invitation"
        description="This invitation link is invalid or has expired."
        actionLabel="Go to login"
        onAction={() => router.push('/login')}
      />
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAccepted = invitation.status === 'ACCEPTED';
  const inviteUrl = `/invite/${token}`;

  if (isExpired || isAccepted) {
    return (
      <StateCard
        icon={
          isAccepted ? (
            <CheckCircle className="h-14 w-14 text-green-500" />
          ) : (
            <XCircle className="h-14 w-14 text-destructive" />
          )
        }
        title={isAccepted ? 'Invitation already accepted' : 'Invitation expired'}
        description={
          isAccepted
            ? 'This invitation has already been used. You can continue to your dashboard.'
            : 'This invitation has expired. Ask the sender to send a fresh invite.'
        }
        actionLabel={isLoggedIn ? 'Go to dashboard' : 'Go to login'}
        onAction={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
      />
    );
  }

  if (isLoggedIn) {
    if (acceptError) {
      return (
        <StateCard
          icon={<XCircle className="h-14 w-14 text-destructive" />}
          title="Could not join organization"
          description={acceptError}
          secondaryLabel="Try again"
          onSecondary={() => {
            setAcceptError(null);
            autoAcceptAttempted.current = false;
            refetch();
          }}
          actionLabel="Go to dashboard"
          onAction={() => router.push('/dashboard')}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)] bg-background px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
          <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
            <InvitationSteps currentStep={3} />
            <div className="mt-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {isAccepting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              Joining {invitation.organization?.name}...
            </h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;re adding you to the organization and preparing your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)] bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                Invitation ready to accept
              </div>
              <h1 className="mt-6 text-4xl font-bold text-foreground">
                Join {invitation.organization?.name} without losing your place.
              </h1>
              <p className="mt-4 text-base text-muted-foreground">
                Sign in or create your account and we&apos;ll bring you right back here to finish
                joining the organization.
              </p>
              <div className="mt-8">
                <InvitationSteps currentStep={1} />
              </div>
            </div>
          </div>

          <div className="w-full max-w-md justify-self-center">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {invitation.organization?.name?.[0]?.toUpperCase() || '?'}
              </div>

              <h1 className="mt-6 text-center text-3xl font-bold text-foreground">You&apos;re invited</h1>
              <p className="mt-2 text-center text-muted-foreground">
                Join <span className="font-medium text-foreground">{invitation.organization?.name}</span>
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Role:</span> {invitation.role || 'Member'}
                </p>
                <p className="mt-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span> {invitation.email}
                </p>
                <p className="mt-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Expires:</span>{' '}
                  {new Date(invitation.expiresAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 lg:hidden">
                <InvitationSteps currentStep={1} />
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Choose an option below. After authentication, the invite will continue
                automatically.
              </p>

              <div className="mt-6 space-y-3">
                <Button
                  variant="default"
                  className="w-full gap-2"
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/login?redirect=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(invitation.email)}`
                    )
                  }
                >
                  <LogIn className="h-4 w-4" />
                  Log in and accept
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/signup?redirect=${encodeURIComponent(inviteUrl)}&email=${encodeURIComponent(invitation.email)}`
                    )
                  }
                >
                  <UserPlus className="h-4 w-4" />
                  Create account and accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    'Open invite',
    'Log in or sign up',
    'Join organization',
  ];

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < currentStep;
          const active = stepNumber === currentStep;
          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  completed
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'border border-primary bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {completed ? <CheckCircle className="h-4 w-4" /> : stepNumber}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${active || completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step}
                </p>
              </div>
              {index < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
        <div className="flex justify-center">{icon}</div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-3">
          {secondaryLabel && onSecondary && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </div>
  );
}
