import { Router } from 'express';
import * as auditController from '../../controllers/audit.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../models';

const router = Router();

// All audit routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @route   GET /api/v1/audit
 * @desc    Get audit logs
 * @access  Private (Admin)
 */
router.get('/', auditController.getAuditLogs);

/**
 * @route   GET /api/v1/audit/stats
 * @desc    Get audit statistics
 * @access  Private (Admin)
 */
router.get('/stats', auditController.getAuditStats);

/**
 * @route   GET /api/v1/audit/:id
 * @desc    Get audit log by ID
 * @access  Private (Admin)
 */
router.get('/:id', auditController.getAuditLog);

/**
 * @route   GET /api/v1/audit/:entityType/:entityId
 * @desc    Get audit logs for specific entity
 * @access  Private (Admin)
 */
router.get('/:entityType/:entityId', auditController.getEntityAuditLogs);

export default router;