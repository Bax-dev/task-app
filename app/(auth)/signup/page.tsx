import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import { ArrowLeft, CheckCircle2, Rocket, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up | TaskFlow',
  description: 'Create your TaskFlow account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_32%)] bg-background px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              Set up once, move faster every day
            </div>
            <h1 className="mt-6 text-4xl font-bold text-foreground">
              Create your account and join the flow.
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              TaskFlow is designed to get teams moving quickly, with less setup friction and
              clearer next steps across projects, tasks, and collaboration.
            </p>

            <div className="mt-8 space-y-4">
              <FeatureRow
                icon={CheckCircle2}
                title="Fast onboarding"
                description="Create your account, accept invites, and land in the right workspace."
              />
              <FeatureRow
                icon={Users}
                title="Built for collaboration"
                description="Keep context, ownership, and follow-up work visible from day one."
              />
            </div>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
              <p className="mt-2 text-muted-foreground">Get started with TaskFlow</p>
            </div>

            <Suspense fallback={null}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
