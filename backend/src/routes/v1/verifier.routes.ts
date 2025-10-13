import { Router } from 'express';
import * as verifierController from '../../controllers/verifier.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../models';
import { validate } from '../../validators';
import {
  getReviewQueueSchema,
  getReviewSchema,
  submitReviewSchema,
  assignReviewSchema,
  getReviewStatsSchema,
} from '../../validators/verifier.validator';

const router = Router();

// All verifier routes require authentication and VERIFIER or ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.VERIFIER, UserRole.ADMIN));

/**
 * @route   GET /api/v1/verifier/queue
 * @desc    Get manual review queue
 * @access  Private (Verifier, Admin)
 */
router.get('/queue', validate(getReviewQueueSchema), verifierController.getReviewQueue);

/**
 * @route   GET /api/v1/verifier/next
 * @desc    Get next review in queue
 * @access  Private (Verifier, Admin)
 */
router.get('/next', verifierController.getNextReview);

/**
 * @route   GET /api/v1/verifier/my-reviews
 * @desc    Get verifier's assigned reviews
 * @access  Private (Verifier, Admin)
 */
router.get('/my-reviews', verifierController.getMyReviews);

/**
 * @route   GET /api/v1/verifier/stats
 * @desc    Get review statistics
 * @access  Private (Verifier, Admin)
 */
router.get('/stats', validate(getReviewStatsSchema), verifierController.getReviewStats);

/**
 * @route   GET /api/v1/verifier/reviews/:id
 * @desc    Get review by ID
 * @access  Private (Verifier, Admin)
 */
router.get('/reviews/:id', validate(getReviewSchema), verifierController.getReview);

/**
 * @route   POST /api/v1/verifier/reviews/:id/assign
 * @desc    Assign review to verifier
 * @access  Private (Admin)
 */
router.post(
  '/reviews/:id/assign',
  authorize(UserRole.ADMIN),
  validate(assignReviewSchema),
  verifierController.assignReview
);

/**
 * @route   POST /api/v1/verifier/reviews/:id/submit
 * @desc    Submit review decision
 * @access  Private (Verifier, Admin)
 */
router.post('/reviews/:id/submit', validate(submitReviewSchema), verifierController.submitReview);

export default router;