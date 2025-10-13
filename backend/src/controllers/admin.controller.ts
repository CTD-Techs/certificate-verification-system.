import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User, Certificate, Verification, ManualReview, UserRole, ReviewStatus } from '../models';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/error';
import { hashPassword } from '../utils/crypto';
import logger from '../utils/logger';

const userRepository = AppDataSource.getRepository(User);
const certificateRepository = AppDataSource.getRepository(Certificate);
const verificationRepository = AppDataSource.getRepository(Verification);
const reviewRepository = AppDataSource.getRepository(ManualReview);

/**
 * Get all users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.lastLoginAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    // Apply filters
    if (req.query.role) {
      queryBuilder.andWhere('user.role = :role', { role: req.query.role });
    }

    if (req.query.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: req.query.isActive === 'true',
      });
    }

    if (req.query.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${req.query.search}%` }
      );
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder.skip(skip).take(limit).getMany();

    sendPaginatedSuccess(
      res,
      users,
      { page, limit, total },
      'Users retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'lastLoginAt',
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: role || UserRole.API_USER,
      isActive: true,
    });

    await userRepository.save(user);

    logger.info('User created by admin', {
      userId: user.id,
      email: user.email,
      createdBy: req.user!.sub,
    });

    sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      'User created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await userRepository.save(user);

    logger.info('User updated by admin', {
      userId: id,
      updatedBy: req.user!.sub,
    });

    sendSuccess(
      res,
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      'User updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.sub) {
      throw new BadRequestError('Cannot delete your own account');
    }

    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.remove(user);

    logger.info('User deleted by admin', {
      userId: id,
      deletedBy: req.user!.sub,
    });

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCertificates,
      totalVerifications,
      pendingReviews,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ where: { isActive: true } }),
      certificateRepository.count(),
      verificationRepository.count(),
      reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
    ]);

    // Get recent activity
    const recentVerifications = await verificationRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['certificate'],
    });

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      certificates: {
        total: totalCertificates,
      },
      verifications: {
        total: totalVerifications,
      },
      reviews: {
        pending: pendingReviews,
      },
      recentActivity: recentVerifications.map((v) => ({
        id: v.id,
        certificateId: v.certificateId,
        status: v.status,
        result: v.result,
        createdAt: v.createdAt,
      })),
    };

    sendSuccess(res, stats, 'System statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password
 */
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.passwordHash = await hashPassword(newPassword);
    await userRepository.save(user);

    logger.info('User password reset by admin', {
      userId: id,
      resetBy: req.user!.sub,
    });

    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};