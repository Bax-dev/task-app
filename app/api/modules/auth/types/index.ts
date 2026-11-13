import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['forgot-password', 'verify-email']),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'Reset token is required').max(128), // reset token from verify-otp
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['forgot-password', 'verify-email']),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const mfaPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const mfaEnableSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code').max(10),
});

/** `code` is an authenticator code or a recovery code. */
export const mfaReauthSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().min(6, 'Enter a code').max(20),
});

export const mfaVerifySchema = z
  .object({
    mfaToken: z.string().min(1).max(200),
    code: z.string().max(10).optional(),
    recoveryCode: z.string().max(20).optional(),
  })
  .refine((v) => !!v.code !== !!v.recoveryCode, 'Enter the code from your authenticator app or a recovery code');

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type VerifyOTPDTO = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type ResendOTPDTO = z.infer<typeof resendOTPSchema>;

export interface AuthResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
  };
  token: string;
  refreshToken: string;
}
