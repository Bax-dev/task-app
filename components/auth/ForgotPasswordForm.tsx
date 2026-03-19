'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import OTPVerifyForm from './OTPVerifyForm';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const sendOTPMutation = useMutation({
    mutationFn: () => api.post('/api/auth/forgot-password', { email }),
    onSuccess: () => {
      toast.success('Verification code sent to your email');
      setStep('otp');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
      onSubmit={(e) => {
        e.preventDefault();
        sendOTPMutation.mutate();
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
          disabled={sendOTPMutation.isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={sendOTPMutation.isPending}
      >
        {sendOTPMutation.isPending ? 'Sending...' : 'Send Verification Code'}
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
