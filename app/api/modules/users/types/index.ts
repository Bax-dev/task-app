import { z } from 'zod';
import { isValidTimezone } from '@/lib/timezone';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
  timezone: z
    .string()
    .min(1)
    .max(64)
    .refine(isValidTimezone, { message: 'Invalid IANA timezone' })
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).optional().default('MEMBER'),
});

const moduleCardSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(40),
  href: z.string().max(200),
  icon: z.string().max(40),
  visible: z.boolean(),
});

const themeColorSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(40),
  primary: z.string().min(1).max(80),
  primaryDark: z.string().min(1).max(80),
  custom: z.boolean().optional(),
});

export const updatePreferencesSchema = z
  .object({
    themeColorId: z.string().min(1).max(64).optional(),
    customThemeColors: z.array(themeColorSchema).max(50).optional(),
    moduleCards: z.array(moduleCardSchema).max(50).optional(),
    dueSoonEnabled: z.boolean().optional(),
  })
  .strict();

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type AddMemberDTO = z.infer<typeof addMemberSchema>;
export type UpdatePreferencesDTO = z.infer<typeof updatePreferencesSchema>;

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}
