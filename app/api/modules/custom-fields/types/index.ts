import { z } from 'zod';

export const createCustomFieldSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  fieldType: z.enum(['DROPDOWN', 'LABEL', 'CHECKBOX', 'DATE', 'TEXT', 'NUMBER']),
  options: z.any().optional(),
  required: z.boolean().optional(),
  issueTypeId: z.string().uuid('Invalid issue type ID').optional().nullable(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fieldType: z.enum(['DROPDOWN', 'LABEL', 'CHECKBOX', 'DATE', 'TEXT', 'NUMBER']).optional(),
  options: z.any().optional(),
  required: z.boolean().optional(),
});

export const setCustomFieldValueSchema = z.object({
  customFieldId: z.string().uuid('Invalid custom field ID'),
  value: z.string().max(5000),
});

export type CreateCustomFieldDTO = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldDTO = z.infer<typeof updateCustomFieldSchema>;
export type SetCustomFieldValueDTO = z.infer<typeof setCustomFieldValueSchema>;
