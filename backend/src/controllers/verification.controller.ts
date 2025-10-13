import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Verification, VerificationStatus } from '../models';
import verificationOrchestrator from '../services/verification/verification-orchestrator.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import logger from '../utils/logger';

const verificationRepository = AppDataSource.getRepository(Verification);

/**
 * Create a new verification request
 */
export const createVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const { certificateId, verificationType, priority, metadata } = req.body;

    const verification = await verificationOrchestrator.startVerification({
      certificateId,
      verificationType,
      userId,
      priority,
      metadata,
    });

    logger.info('Verification created', {
      verificationId: verification.id,
      certificateId,
      userId,
    });

    sendSuccess(
      res,
      verification,
      'Verification started successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification by ID
 */
export const getVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  
  try {
    // DEBUG: Log the request
    logger.info('DEBUG: getVerification called', {
      verificationId: id,
      userId: req.user!.sub,
      userEmail: req.user!.email,
      userRole: req.user!.role
    });

    const verification = await verificationOrchestrator.getVerification(id);

    // DEBUG: Log what we found
    logger.info('DEBUG: getVerification result', {
      verificationId: id,
      found: !!verification,
      certificateId: verification?.certificateId,
      certificateUserId: verification?.certificate?.userId
    });

    sendSuccess(res, verification, 'Verification retrieved successfully');
  } catch (error) {
    logger.error('DEBUG: getVerification error', {
      verificationId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
};

/**
 * List verifications
 */
export const listVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = verificationRepository
      .createQueryBuilder('verification')
      .leftJoinAndSelect('verification.certificate', 'certificate')
      .leftJoinAndSelect('verification.steps', 'steps');

    // Apply filters
    if (req.query.status) {
      queryBuilder.andWhere('verification.status = :status', {
        status: req.query.status,
      });
    }

    if (req.query.result) {
      queryBuilder.andWhere('verification.result = :result', {
        result: req.query.result,
      });
    }

    if (req.query.certificateId) {
      queryBuilder.andWhere('verification.certificateId = :certificateId', {
        certificateId: req.query.certificateId,
      });
    }

    if (req.query.startDate) {
      queryBuilder.andWhere('verification.createdAt >= :startDate', {
        startDate: new Date(req.query.startDate as string),
      });
    }

    if (req.query.endDate) {
      queryBuilder.andWhere('verification.createdAt <= :endDate', {
        endDate: new Date(req.query.endDate as string),
      });
    }

    // Order by creation date
    queryBuilder.orderBy('verification.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const verifications = await queryBuilder.skip(skip).take(limit).getMany();

    sendPaginatedSuccess(
      res,
      verifications,
      { page, limit, total },
      'Verifications retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification steps
 */
export const getVerificationSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const steps = await verificationOrchestrator.getVerificationSteps(id);

    sendSuccess(res, steps, 'Verification steps retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Retry failed verification
 */
export const retryVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.sub;

  try {
    // DEBUG: Log retry request
    logger.info('[VERIFICATION] Retry request received', {
      verificationId: id,
      userId,
      userEmail: req.user!.email,
      userRole: req.user!.role,
    });

    const verification = await verificationOrchestrator.retryVerification(id, userId);

    // DEBUG: Log successful retry initiation
    logger.info('[VERIFICATION] Retry initiated successfully', {
      verificationId: id,
      userId,
      status: verification.status,
      certificateId: verification.certificateId,
    });

    sendSuccess(res, verification, 'Verification retry started successfully');
  } catch (error) {
    // DEBUG: Log retry error with full details
    logger.error('[VERIFICATION] Retry failed', {
      verificationId: id,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : typeof error,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    next(error);
  }
};

/**
 * Get verification statistics
 */
export const getVerificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryBuilder = verificationRepository.createQueryBuilder('verification');

    if (req.query.startDate) {
      queryBuilder.andWhere('verification.createdAt >= :startDate', {
        startDate: new Date(req.query.startDate as string),
      });
    }

    if (req.query.endDate) {
      queryBuilder.andWhere('verification.createdAt <= :endDate', {
        endDate: new Date(req.query.endDate as string),
      });
    }

    const verifications = await queryBuilder.getMany();

    const stats = {
      total: verifications.length,
      pending: verifications.filter((v) => v.status === VerificationStatus.PENDING).length,
      inProgress: verifications.filter((v) => v.status === VerificationStatus.IN_PROGRESS).length,
      completed: verifications.filter((v) => v.status === VerificationStatus.COMPLETED).length,
      failed: verifications.filter((v) => v.status === VerificationStatus.FAILED).length,
      avgConfidenceScore: 0,
      avgDuration: 0,
    };

    // Calculate averages
    const completedVerifications = verifications.filter(
      (v) => v.status === VerificationStatus.COMPLETED && v.confidenceScore !== undefined
    );

    if (completedVerifications.length > 0) {
      const totalConfidence = completedVerifications.reduce(
        (sum, v) => sum + (v.confidenceScore || 0),
        0
      );
      stats.avgConfidenceScore = Math.round((totalConfidence / completedVerifications.length) * 100) / 100;

      const totalDuration = completedVerifications.reduce(
        (sum, v) => sum + (v.durationMs || 0),
        0
      );
      stats.avgDuration = Math.round(totalDuration / completedVerifications.length);
    }

    sendSuccess(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};