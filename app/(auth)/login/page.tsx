import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Log In | TaskFlow',
  description: 'Log in to your TaskFlow account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-card rounded-lg border border-border shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Log in to your TaskFlow account
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
