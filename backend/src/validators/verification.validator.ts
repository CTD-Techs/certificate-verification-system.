import { z } from 'zod';
import { VerificationType } from '../models';

/**
 * Create verification request validation schema
 */
export const createVerificationSchema = z.object({
  body: z.object({
    certificateId: z.string().uuid('Invalid certificate ID'),
    verificationType: z.nativeEnum(VerificationType),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Get verification by ID validation schema
 */
export const getVerificationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid verification ID'),
  }),
});

/**
 * List verifications validation schema
 */
export const listVerificationsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.string().optional(),
    result: z.string().optional(),
    certificateId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

/**
 * Get verification steps validation schema
 */
export const getVerificationStepsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid verification ID'),
  }),
});

/**
 * Retry verification validation schema
 */
export const retryVerificationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid verification ID'),
  }),
});

export type CreateVerificationInput = z.infer<typeof createVerificationSchema>['body'];
export type GetVerificationInput = z.infer<typeof getVerificationSchema>['params'];
export type ListVerificationsInput = z.infer<typeof listVerificationsSchema>['query'];
export type GetVerificationStepsInput = z.infer<typeof getVerificationStepsSchema>['params'];
export type RetryVerificationInput = z.infer<typeof retryVerificationSchema>['params'];