'use client';

import { useState, type FormEvent } from 'react';
import { ShieldCheck, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetMfaStatusQuery,
  useSetupMfaMutation,
  useEnableMfaMutation,
  useDisableMfaMutation,
  useRegenerateMfaRecoveryCodesMutation,
  type MfaSetup,
} from '@/store/api';

const errMsg = (e: any) => e?.data?.message || e?.message || 'Something went wrong';

// Settings section for two-step verification (authenticator app + recovery codes).
export default function TwoFactorCard() {
  const { data: status, isLoading } = useGetMfaStatusQuery();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [manage, setManage] = useState<'disable' | 'regenerate' | null>(null);
  const [step, setStep] = useState<'idle' | 'password'>('idle');

  if (isLoading || !status) return <Skeleton className="h-48 rounded-2xl" />;

  let body;
  if (recoveryCodes) {
    body = <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />;
  } else if (setup) {
    body = <ConfirmSetup setup={setup} onEnabled={(codes) => { setSetup(null); setRecoveryCodes(codes); }} onCancel={() => setSetup(null)} />;
  } else if (status.enabled && manage) {
    body = (
      <ReauthForm
        mode={manage}
        onCancel={() => setManage(null)}
        onDone={(codes) => { setManage(null); if (codes) setRecoveryCodes(codes); }}
      />
    );
  } else if (status.enabled) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          On since {status.confirmedAt ? new Date(status.confirmedAt).toLocaleDateString() : '—'}.{' '}
          {status.recoveryCodesRemaining} of 10 recovery codes left.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setManage('regenerate')}>New recovery codes</Button>
          <Button variant="destructive" onClick={() => setManage('disable')}>Turn off</Button>
        </div>
      </div>
    );
  } else if (step === 'password') {
    body = <StartSetup onStarted={(s) => { setStep('idle'); setSetup(s); }} onCancel={() => setStep('idle')} />;
  } else {
    body = <Button onClick={() => setStep('password')}>Set up two-step verification</Button>;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-1">
        <ShieldCheck className="h-5 w-5" /> Two-step verification
        {status.enabled && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">On</span>}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Ask for a code from an authenticator app each time you sign in.</p>
      {body}
    </div>
  );
}

function StartSetup({ onStarted, onCancel }: { onStarted: (s: MfaSetup) => void; onCancel: () => void }) {
  const [password, setPassword] = useState('');
  const [start, { isLoading }] = useSetupMfaMutation();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      onStarted(await start({ password }).unwrap());
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="mfa-password">Confirm your password</Label>
        <Input id="mfa-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || !password}>Continue</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function ConfirmSetup({ setup, onEnabled, onCancel }: { setup: MfaSetup; onEnabled: (codes: string[]) => void; onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [enable, { isLoading }] = useEnableMfaMutation();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await enable({ code: code.replace(/\D/g, '') }).unwrap();
      toast.success('Two-step verification is on');
      onEnabled(res.recoveryCodes);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const grouped = setup.secret.match(/.{1,4}/g)?.join(' ') ?? setup.secret;
  return (
    <form onSubmit={submit} className="space-y-4">
      <ol className="list-decimal space-y-3 pl-5 text-sm">
        <li>
          In your authenticator app (Google Authenticator, 1Password, Authy…), add an account with this setup key,
          or <a href={setup.otpauthUrl} className="text-primary hover:underline">open it in your authenticator</a> on this device:
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm tracking-wider">{grouped}</code>
            <Button type="button" size="icon" variant="ghost" aria-label="Copy setup key"
              onClick={() => navigator.clipboard.writeText(setup.secret).then(() => toast.success('Copied'))}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </li>
        <li>Enter the 6-digit code it shows.</li>
      </ol>
      <div className="space-y-2">
        <Label htmlFor="mfa-enable-code">Authentication code</Label>
        <Input id="mfa-enable-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code}
          onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-40 tracking-[.3em]" autoFocus />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || code.replace(/\D/g, '').length !== 6}>Turn on</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const text = codes.join('\n');
  const download = () => {
    const url = URL.createObjectURL(new Blob([`TaskFlow recovery codes\n\n${text}\n`], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'taskflow-recovery-codes.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Save these recovery codes somewhere safe. Each one signs you in once if you lose your authenticator.
        <strong> They won&apos;t be shown again.</strong>
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success('Copied'))}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </Button>
        <Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" /> Download</Button>
        <Button onClick={onDone}>I&apos;ve saved them</Button>
      </div>
    </div>
  );
}

function ReauthForm({ mode, onCancel, onDone }: { mode: 'disable' | 'regenerate'; onCancel: () => void; onDone: (codes?: string[]) => void }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [disable, { isLoading: disabling }] = useDisableMfaMutation();
  const [regenerate, { isLoading: regenerating }] = useRegenerateMfaRecoveryCodesMutation();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'disable') {
        await disable({ password, code: code.trim() }).unwrap();
        toast.success('Two-step verification is off');
        onDone();
      } else {
        onDone((await regenerate({ password, code: code.trim() }).unwrap()).recoveryCodes);
      }
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {mode === 'disable' ? 'Confirm it\'s you to turn off two-step verification.' : 'Confirm it\'s you. Your old recovery codes will stop working.'}
      </p>
      <div className="space-y-2">
        <Label htmlFor="mfa-reauth-password">Password</Label>
        <Input id="mfa-reauth-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mfa-reauth-code">Authenticator or recovery code</Label>
        <Input id="mfa-reauth-code" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant={mode === 'disable' ? 'destructive' : 'default'} disabled={disabling || regenerating || !password || !code}>
          {mode === 'disable' ? 'Turn off' : 'Generate new codes'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
