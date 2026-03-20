import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).optional().default('MEMBER'),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type AddMemberDTO = z.infer<typeof addMemberSchema>;

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}
