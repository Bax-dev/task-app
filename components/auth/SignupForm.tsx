'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRegisterMutation } from '@/store/api';
import GoogleSignInButton from './GoogleSignInButton';
import { Eye, EyeOff } from 'lucide-react';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email') || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [register, { isLoading }] = useRegisterMutation();

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  }, [password]);

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    else if (firstName.trim().length < 2) errs.firstName = 'First name must be at least 2 characters';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    else if (lastName.trim().length < 2) errs.lastName = 'Last name must be at least 2 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) errs.password = 'Password must contain at least one uppercase letter';
    else if (!/[a-z]/.test(password)) errs.password = 'Password must contain at least one lowercase letter';
    else if (!/[0-9]/.test(password)) errs.password = 'Password must contain at least one number';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const validateField = (field: string) => {
    const allErrors = validate();
    setErrors((prev) => ({ ...prev, [field]: allErrors[field as keyof FieldErrors] }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { firstName: true, lastName: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const name = `${firstName.trim()} ${lastName.trim()}`;
    try {
      await register({ name, email: email.trim(), password }).unwrap();
      toast.success('Account created successfully!');
      window.location.href = redirect || '/dashboard';
    } catch (error: any) {
      const msg = error?.data?.error || error?.data?.message || error?.message || 'Registration failed';
      if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else {
        toast.error(msg);
      }
    }
  };

  const fieldErrorClass = (field: string) =>
    touched[field] && errors[field as keyof FieldErrors] ? 'border-red-500 focus-visible:ring-red-500' : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); if (touched.firstName) validateField('firstName'); }}
            onBlur={() => handleBlur('firstName')}
            disabled={isLoading}
            className={`placeholder:opacity-50 ${fieldErrorClass('firstName')}`}
          />
          {touched.firstName && errors.firstName && (
            <p className="text-xs text-red-500">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); if (touched.lastName) validateField('lastName'); }}
            onBlur={() => handleBlur('lastName')}
            disabled={isLoading}
            className={`placeholder:opacity-50 ${fieldErrorClass('lastName')}`}
          />
          {touched.lastName && errors.lastName && (
            <p className="text-xs text-red-500">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email'); }}
          onBlur={() => handleBlur('email')}
          disabled={isLoading}
          className={`placeholder:opacity-50 ${fieldErrorClass('email')}`}
        />
        {touched.email && errors.email && (
          <p className="text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 characters, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password'); }}
            onBlur={() => handleBlur('password')}
            disabled={isLoading}
            className={`pr-10 placeholder:opacity-50 ${fieldErrorClass('password')}`}
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
        {touched.password && errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
        {password && !errors.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < passwordStrength.score ? passwordStrength.color : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${
              passwordStrength.label === 'Weak' ? 'text-red-500' :
              passwordStrength.label === 'Fair' ? 'text-yellow-500' :
              passwordStrength.label === 'Good' ? 'text-blue-500' : 'text-green-500'
            }`}>
              {passwordStrength.label}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) validateField('confirmPassword'); }}
            onBlur={() => handleBlur('confirmPassword')}
            disabled={isLoading}
            className={`pr-10 placeholder:opacity-50 ${fieldErrorClass('confirmPassword')}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {touched.confirmPassword && errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary hover:underline font-medium">
          Log in
        </a>
      </p>

      <GoogleSignInButton />
    </form>
  );
}
