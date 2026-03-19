import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up | TaskFlow',
  description: 'Create your TaskFlow account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-card rounded-lg border border-border shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Get started with TaskFlow
            </p>
          </div>

          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
