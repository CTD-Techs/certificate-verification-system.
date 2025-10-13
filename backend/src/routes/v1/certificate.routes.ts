import { Router } from 'express';
import * as certificateController from '../../controllers/certificate.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../validators';
import {
  uploadCertificateSchema,
  getCertificateSchema,
  listCertificatesSchema,
  deleteCertificateSchema,
} from '../../validators/certificate.validator';

const router = Router();

// All certificate routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/certificates
 * @desc    Upload a new certificate
 * @access  Private
 */
router.post('/', validate(uploadCertificateSchema), certificateController.uploadCertificate);

/**
 * @route   GET /api/v1/certificates
 * @desc    List all certificates for current user
 * @access  Private
 */
router.get('/', validate(listCertificatesSchema), certificateController.listCertificates);

/**
 * @route   GET /api/v1/certificates/stats
 * @desc    Get certificate statistics
 * @access  Private
 */
router.get('/stats', certificateController.getCertificateStats);

/**
 * @route   GET /api/v1/certificates/:id
 * @desc    Get certificate by ID
 * @access  Private
 */
router.get('/:id', validate(getCertificateSchema), certificateController.getCertificate);

/**
 * @route   PUT /api/v1/certificates/:id
 * @desc    Update certificate
 * @access  Private
 */
router.put('/:id', validate(getCertificateSchema), certificateController.updateCertificate);

/**
 * @route   DELETE /api/v1/certificates/:id
 * @desc    Delete certificate
 * @access  Private
 */
router.delete('/:id', validate(deleteCertificateSchema), certificateController.deleteCertificate);

export default router;