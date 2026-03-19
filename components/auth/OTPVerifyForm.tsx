'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useVerifyOtpMutation, useResendOtpMutation } from '@/store/api';
import { ArrowLeft } from 'lucide-react';
import ResetPasswordForm from './ResetPasswordForm';

interface OTPVerifyFormProps {
  email: string;
  purpose: 'forgot-password' | 'verify-email';
  onBack: () => void;
}

export default function OTPVerifyForm({ email, purpose, onBack }: OTPVerifyFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'otp' | 'reset'>('otp');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullOtp = newOtp.join('');
    if (fullOtp.length === 6) {
      handleVerify(fullOtp);
    }
  };

  const handleVerify = async (otpCode: string) => {
    try {
      await verifyOtp({ email, otp: otpCode, purpose }).unwrap();
      toast.success('Code verified!');
      if (purpose === 'forgot-password') {
        setStep('reset');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Invalid code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ email, purpose }).unwrap();
      toast.success('New code sent!');
      setCountdown(300);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to resend code');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      handleVerify(pasted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'reset') {
    return <ResetPasswordForm email={email} />;
  }

  return (
    <div className="space-y-6 w-full">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOTPChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-xl font-bold"
            disabled={isVerifying}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Code expires in{' '}
            <span className="font-medium text-foreground">
              {formatTime(countdown)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-destructive font-medium">Code expired</p>
        )}
      </div>

      {/* Verify Button */}
      <Button
        onClick={() => {
          const fullOtp = otp.join('');
          if (fullOtp.length === 6) {
            handleVerify(fullOtp);
          } else {
            toast.error('Please enter the complete 6-digit code');
          }
        }}
        className="w-full"
        disabled={isVerifying || otp.join('').length !== 6}
      >
        {isVerifying ? 'Verifying...' : 'Verify Code'}
      </Button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-muted-foreground">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
