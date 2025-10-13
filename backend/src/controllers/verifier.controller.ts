import { Request, Response, NextFunction } from 'express';
import { ReviewStatus, ReviewPriority } from '../models';
import manualReviewService from '../services/verification/manual-review.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import logger from '../utils/logger';

/**
 * Get manual review queue
 */
export const getReviewQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ReviewStatus | undefined;
    const priority = req.query.priority as ReviewPriority | undefined;

    const { reviews, total } = await manualReviewService.getReviewQueue({
      status,
      priority,
      page,
      limit,
    });

    sendPaginatedSuccess(
      res,
      reviews,
      { page, limit, total },
      'Review queue retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get review by ID
 */
export const getReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await manualReviewService.getReview(id);

    sendSuccess(res, review, 'Review retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get next review in queue
 */
export const getNextReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifierId = req.user!.sub;

    const review = await manualReviewService.getNextReview(verifierId);

    if (!review) {
      sendSuccess(res, null, 'No reviews available in queue');
    } else {
      sendSuccess(res, review, 'Next review retrieved successfully');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Assign review to verifier
 */
export const assignReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { verifierId } = req.body;

    const review = await manualReviewService.assignReview(id, verifierId);

    logger.info('Review assigned', {
      reviewId: id,
      verifierId,
      assignedBy: req.user!.sub,
    });

    sendSuccess(res, review, 'Review assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Submit review decision
 */
export const submitReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const verifierId = req.user!.sub;
    const { decision, comments, confidenceScore, evidence } = req.body;

    const review = await manualReviewService.submitReview(id, verifierId, {
      decision,
      comments,
      confidenceScore,
      evidence,
    });

    logger.info('Review submitted', {
      reviewId: id,
      verifierId,
      decision,
    });

    sendSuccess(res, review, 'Review submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics
 */
export const getReviewStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: any = {};

    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    // If verifier role, get their own stats
    if (req.user!.role === 'VERIFIER') {
      filters.verifierId = req.user!.sub;
    }

    const stats = await manualReviewService.getStatistics(filters);

    sendSuccess(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get verifier's assigned reviews
 */
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifierId = req.user!.sub;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ReviewStatus | undefined;

    const { reviews, total } = await manualReviewService.getReviewQueue({
      verifierId,
      status,
      page,
      limit,
    });

    sendPaginatedSuccess(
      res,
      reviews,
      { page, limit, total },
      'Your reviews retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};