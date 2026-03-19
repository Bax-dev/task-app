'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '@/store/api';
import OTPVerifyForm from './OTPVerifyForm';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  if (step === 'otp') {
    return (
      <OTPVerifyForm
        email={email}
        purpose="forgot-password"
        onBack={() => setStep('email')}
      />
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await forgotPassword({ email }).unwrap();
          toast.success('Verification code sent to your email');
          setStep('otp');
        } catch (error: any) {
          toast.error(error?.data?.message || error?.message || 'Failed to send code');
        }
      }}
      className="space-y-4 w-full"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Verification Code'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Log in
        </a>
      </p>
    </form>
  );
}
