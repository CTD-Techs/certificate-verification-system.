import { Router } from 'express';
import multer from 'multer';
import { documentProcessingController } from '../../controllers/document-processing.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed'));
    }
  },
});

/**
 * @route   POST /api/v1/document-processing/aadhaar/upload
 * @desc    Upload and process Aadhaar document
 * @access  Private
 */
router.post(
  '/aadhaar/upload',
  authenticate,
  upload.single('document'),
  documentProcessingController.uploadAadhaar
);

/**
 * @route   POST /api/v1/document-processing/pan/upload
 * @desc    Upload and process PAN document
 * @access  Private
 */
router.post(
  '/pan/upload',
  authenticate,
  upload.single('document'),
  documentProcessingController.uploadPAN
);

/**
 * @route   GET /api/v1/document-processing/:id
 * @desc    Get document processing status
 * @access  Private
 */
router.get('/:id', authenticate, documentProcessingController.getProcessingStatus);

/**
 * @route   GET /api/v1/document-processing/:id/data
 * @desc    Get extracted data from processed document
 * @access  Private
 */
router.get('/:id/data', authenticate, documentProcessingController.getExtractedData);

/**
 * @route   POST /api/v1/document-processing/:id/corrections
 * @desc    Submit field corrections for processed document
 * @access  Private
 */
router.post('/:id/corrections', authenticate, documentProcessingController.submitCorrections);

/**
 * @route   POST /api/v1/document-processing/match/pan-aadhaar
 * @desc    Match PAN and Aadhaar documents
 * @access  Private
 */
router.post('/match/pan-aadhaar', authenticate, documentProcessingController.matchPANAadhaar);

/**
 * @route   POST /api/v1/document-processing/match/signatures
 * @desc    Match signatures from two documents
 * @access  Private
 */
router.post('/match/signatures', authenticate, documentProcessingController.matchSignatures);

/**
 * @route   GET /api/v1/document-processing
 * @desc    List user's document processing records
 * @access  Private
 */
router.get('/', authenticate, documentProcessingController.listDocuments);

export default router;