'use client';

import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVerifyMfaMutation } from '@/store/api';

// The second sign-in step: a code from the authenticator app, or a recovery code.
export default function MfaChallengeForm({
  mfaToken,
  onSignedIn,
  onRestart,
}: {
  mfaToken: string;
  onSignedIn: () => void;
  onRestart: () => void;
}) {
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [verify, { isLoading }] = useVerifyMfaMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = code.replace(/\D/g, '');
    if (!useRecovery && digits.length !== 6) return setError('Enter the 6-digit code from your authenticator app.');
    if (useRecovery && code.trim().length < 8) return setError('Enter one of your recovery codes.');
    try {
      const res = await verify(useRecovery ? { mfaToken, recoveryCode: code.trim() } : { mfaToken, code: digits }).unwrap();
      if (useRecovery) toast.warning(`Recovery code used. ${res.recoveryCodesRemaining} left.`);
      onSignedIn();
    } catch (err: any) {
      // The challenge is gone (expired, used, or too many wrong codes): only a fresh sign-in helps.
      // (A plain 429 from the IP rate limiter just means wait; the challenge is still good.)
      const message: string = err?.data?.message || 'Verification failed';
      if (err?.status === 401 || /wrong codes/i.test(message)) setExpired(true);
      setError(message);
    }
  };

  const switchMethod = () => {
    setUseRecovery(!useRecovery);
    setCode('');
    setError('');
  };

  return (
    <form onSubmit={submit} noValidate className="w-full max-w-md space-y-4">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Two-step verification</h1>
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0" />
        <span>
          {useRecovery
            ? 'Enter one of the recovery codes you saved when you turned on two-step verification. Each code works once.'
            : 'Open your authenticator app and enter the 6-digit code for TaskFlow.'}
        </span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mfa-code">{useRecovery ? 'Recovery code' : 'Authentication code'}</Label>
        {useRecovery ? (
          <Input id="mfa-code" autoComplete="off" autoCapitalize="none" spellCheck={false} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder="abcde-fghjk" autoFocus />
        ) : (
          <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder="123456" className="text-center text-lg tracking-[.4em]" autoFocus />
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {expired ? (
        <Button type="button" className="w-full" onClick={onRestart}>Sign in again</Button>
      ) : (
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify and sign in'}
        </Button>
      )}
      <div className="flex items-center justify-between text-xs">
        <button type="button" className="font-medium text-primary hover:underline" onClick={switchMethod}>
          {useRecovery ? 'Use authenticator app' : 'Use a recovery code'}
        </button>
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={onRestart}>
          Back to sign in
        </button>
      </div>
    </form>
  );
}
