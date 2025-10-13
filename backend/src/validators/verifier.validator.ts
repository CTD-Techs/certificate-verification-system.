import { z } from 'zod';
import { ReviewDecision } from '../models';

/**
 * Get manual review queue validation schema
 */
export const getReviewQueueSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.string().optional(),
  }),
});

/**
 * Get review by ID validation schema
 */
export const getReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
});

/**
 * Submit review decision validation schema
 */
export const submitReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
  body: z.object({
    decision: z.nativeEnum(ReviewDecision),
    comments: z.string().min(10, 'Comments must be at least 10 characters').max(2000),
    confidenceScore: z.number().min(0).max(100).optional(),
    evidence: z.array(z.string()).optional(),
  }),
});

/**
 * Assign review validation schema
 */
export const assignReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid review ID'),
  }),
  body: z.object({
    verifierId: z.string().uuid('Invalid verifier ID'),
  }),
});

/**
 * Get review statistics validation schema
 */
export const getReviewStatsSchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export type GetReviewQueueInput = z.infer<typeof getReviewQueueSchema>['query'];
export type GetReviewInput = z.infer<typeof getReviewSchema>['params'];
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type AssignReviewInput = z.infer<typeof assignReviewSchema>;
export type GetReviewStatsInput = z.infer<typeof getReviewStatsSchema>['query'];