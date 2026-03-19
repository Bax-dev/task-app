import { Metadata } from 'next';
import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Forgot Password | TaskFlow',
  description: 'Reset your TaskFlow password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-card rounded-lg border border-border shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Forgot Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email and we&apos;ll send you a verification code
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
