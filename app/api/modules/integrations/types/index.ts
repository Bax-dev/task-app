import { z } from 'zod';

export const createIntegrationSchema = z.object({
  type: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET', 'SLACK', 'CONFLUENCE', 'FIGMA', 'ZENDESK', 'SALESFORCE']),
  name: z.string().min(1, 'Name is required').max(200),
  config: z.any().optional(),
  enabled: z.boolean().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  config: z.any().optional(),
  enabled: z.boolean().optional(),
});

export type CreateIntegrationDTO = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationDTO = z.infer<typeof updateIntegrationSchema>;
