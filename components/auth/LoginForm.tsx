'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { isMfaChallenge, useLoginMutation } from '@/store/api';
import GoogleSignInButton from './GoogleSignInButton';
import MfaChallengeForm from './MfaChallengeForm';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  // Google sign-in for an account with MFA lands here with the challenge in the URL fragment.
  useEffect(() => {
    const readHash = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get('mfaToken');
      if (!token) return;
      setMfaToken(token);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const finishSignIn = () => {
    toast.success('Logged in successfully!');
    // Same-site paths only: `?redirect=//evil.com` must not bounce a fresh session off-site.
    window.location.href = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      if (isMfaChallenge(result)) {
        setMfaToken(result.mfaToken);
        setPassword('');
        return;
      }
      finishSignIn();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Invalid credentials');
    }
  };

  if (mfaToken) {
    return <MfaChallengeForm mfaToken={mfaToken} onSignedIn={finishSignIn} onRestart={() => setMfaToken(null)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {redirect && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          You&apos;ll continue to your invitation or previous page right after you sign in.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="placeholder:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            className="pr-10 placeholder:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary hover:underline font-medium">
          Sign up
        </a>
      </p>

      <GoogleSignInButton />
    </form>
  );
}
