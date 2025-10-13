import { Router } from 'express';
import * as verificationController from '../../controllers/verification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../validators';
import {
  createVerificationSchema,
  getVerificationSchema,
  listVerificationsSchema,
  getVerificationStepsSchema,
  retryVerificationSchema,
} from '../../validators/verification.validator';

const router = Router();

// All verification routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/verifications
 * @desc    Create a new verification request
 * @access  Private
 */
router.post('/', validate(createVerificationSchema), verificationController.createVerification);

/**
 * @route   GET /api/v1/verifications
 * @desc    List all verifications
 * @access  Private
 */
router.get('/', validate(listVerificationsSchema), verificationController.listVerifications);

/**
 * @route   GET /api/v1/verifications/stats
 * @desc    Get verification statistics
 * @access  Private
 */
router.get('/stats', verificationController.getVerificationStats);

/**
 * @route   GET /api/v1/verifications/:id
 * @desc    Get verification by ID
 * @access  Private
 */
router.get('/:id', validate(getVerificationSchema), verificationController.getVerification);

/**
 * @route   GET /api/v1/verifications/:id/steps
 * @desc    Get verification steps
 * @access  Private
 */
router.get('/:id/steps', validate(getVerificationStepsSchema), verificationController.getVerificationSteps);

/**
 * @route   POST /api/v1/verifications/:id/retry
 * @desc    Retry failed verification
 * @access  Private
 */
router.post('/:id/retry', validate(retryVerificationSchema), verificationController.retryVerification);

export default router;