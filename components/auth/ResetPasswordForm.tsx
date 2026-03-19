'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  email: string;
}

export default function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      }),
    onSuccess: () => {
      setSuccess(true);
      toast.success('Password reset successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (success) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Password Reset!</h3>
        <p className="text-muted-foreground">
          Your password has been reset successfully.
        </p>
        <Button onClick={() => router.push('/login')} className="w-full">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        resetMutation.mutate();
      }}
      className="space-y-4 w-full"
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-foreground">Set New Password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the verification code and your new password
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          maxLength={6}
          disabled={resetMutation.isPending}
          className="text-center text-lg tracking-widest"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          disabled={resetMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          disabled={resetMutation.isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={resetMutation.isPending}
      >
        {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}
