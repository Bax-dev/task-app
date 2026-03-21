import { z } from 'zod';

export const createIssueLinkSchema = z.object({
  sourceTaskId: z.string().uuid('Invalid source task ID'),
  targetTaskId: z.string().uuid('Invalid target task ID'),
  linkType: z.enum(['BLOCKS', 'BLOCKED_BY', 'DUPLICATES', 'DUPLICATED_BY', 'CLONES', 'CLONED_BY', 'RELATES_TO']),
});

export type CreateIssueLinkDTO = z.infer<typeof createIssueLinkSchema>;
