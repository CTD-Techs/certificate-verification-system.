import { Router } from 'express';
import * as adminController from '../../controllers/admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../models';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post('/users', adminController.createUser);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get('/users/:id', adminController.getUser);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   POST /api/v1/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin)
 */
router.post('/users/:id/reset-password', adminController.resetUserPassword);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/stats', adminController.getSystemStats);

export default router;