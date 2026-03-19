import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  organizationId: z.string().uuid('Invalid organization ID'),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST']).optional().default('MEMBER'),
});

// The output type after parsing (role is always present due to default)
export type CreateInvitationInput = z.input<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type CreateInvitationDTO = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationDTO = z.infer<typeof acceptInvitationSchema>;
