import { Router } from 'express';
import authRoutes from './auth.routes';
import certificateRoutes from './certificate.routes';
import verificationRoutes from './verification.routes';
import verifierRoutes from './verifier.routes';
import auditRoutes from './audit.routes';
import adminRoutes from './admin.routes';
import documentProcessingRoutes from './document-processing.routes';

const router = Router();

/**
 * Mount all v1 API routes
 */
router.use('/auth', authRoutes);
router.use('/certificates', certificateRoutes);
router.use('/verifications', verificationRoutes);
router.use('/verifier', verifierRoutes);
router.use('/audit', auditRoutes);
router.use('/admin', adminRoutes);
router.use('/document-processing', documentProcessingRoutes);

/**
 * API v1 health check
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

export default router;