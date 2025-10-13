import { AppDataSource } from '../../config/database';
import { ManualReview, ReviewStatus, ReviewPriority, ReviewDecision, Certificate } from '../../models';
import { NotFoundError, BadRequestError } from '../../utils/error';
import logger from '../../utils/logger';

export interface CreateReviewData {
  certificateId: string;
  reason: string;
  priority?: ReviewPriority;
}

export interface SubmitReviewData {
  decision: ReviewDecision;
  comments: string;
  confidenceScore?: number;
  evidence?: string[];
}

/**
 * Service to manage manual review queue
 */
class ManualReviewService {
  private reviewRepository = AppDataSource.getRepository(ManualReview);
  private certificateRepository = AppDataSource.getRepository(Certificate);

  /**
   * Create a new manual review request
   */
  async createReview(data: CreateReviewData): Promise<ManualReview> {
    logger.info('Creating manual review', { certificateId: data.certificateId });

    // Check if certificate exists
    const certificate = await this.certificateRepository.findOne({
      where: { id: data.certificateId },
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findOne({
      where: { certificateId: data.certificateId, status: ReviewStatus.PENDING },
    });

    if (existingReview) {
      logger.warn('Pending review already exists', { certificateId: data.certificateId });
      return existingReview;
    }

    // Create review
    const review = this.reviewRepository.create({
      certificateId: data.certificateId,
      status: ReviewStatus.PENDING,
      priority: data.priority || ReviewPriority.MEDIUM,
      internalNotes: data.reason,
    });

    await this.reviewRepository.save(review);

    logger.info('Manual review created', {
      reviewId: review.id,
      priority: review.priority,
    });

    return review;
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<ManualReview> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['certificate', 'certificate.verifications', 'certificate.verifications.steps', 'verifier'],
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Get review queue with filters
   */
  async getReviewQueue(filters: {
    status?: ReviewStatus;
    priority?: ReviewPriority;
    verifierId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: ManualReview[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.certificate', 'certificate')
      .leftJoinAndSelect('review.verifier', 'verifier');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('review.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      queryBuilder.andWhere('review.priority = :priority', { priority: filters.priority });
    }

    if (filters.verifierId) {
      queryBuilder.andWhere('review.verifierId = :verifierId', { verifierId: filters.verifierId });
    }

    // Order by priority and creation date
    queryBuilder
      .orderBy('review.priority', 'DESC')
      .addOrderBy('review.createdAt', 'ASC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const reviews = await queryBuilder.skip(skip).take(limit).getMany();

    logger.info('Review queue fetched', {
      total,
      page,
      limit,
      filters,
    });

    return { reviews, total };
  }

  /**
   * Assign review to verifier
   */
  async assignReview(reviewId: string, verifierId: string): Promise<ManualReview> {
    const review = await this.getReview(reviewId);

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestError('Review is not in pending status');
    }

    review.verifierId = verifierId;
    review.status = ReviewStatus.IN_PROGRESS;
    review.assignedAt = new Date();
    review.startedAt = new Date();

    await this.reviewRepository.save(review);

    logger.info('Review assigned', {
      reviewId,
      verifierId,
    });

    return review;
  }

  /**
   * Submit review decision
   */
  async submitReview(
    reviewId: string,
    verifierId: string,
    data: SubmitReviewData
  ): Promise<ManualReview> {
    const review = await this.getReview(reviewId);

    if (review.status === ReviewStatus.COMPLETED) {
      throw new BadRequestError('Review is already completed');
    }

    if (review.verifierId && review.verifierId !== verifierId) {
      throw new BadRequestError('Review is assigned to another verifier');
    }

    // Update review
    review.status = ReviewStatus.COMPLETED;
    review.decision = data.decision;
    review.comments = data.comments;
    review.verifierId = verifierId;
    review.completedAt = new Date();

    await this.reviewRepository.save(review);

    logger.info('Review submitted', {
      reviewId,
      decision: data.decision,
      verifierId,
    });

    return review;
  }

  /**
   * Get review statistics
   */
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    verifierId?: string;
  }): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    approved: number;
    rejected: number;
    needsInfo: number;
    avgReviewTime: number;
  }> {
    const queryBuilder = this.reviewRepository.createQueryBuilder('review');

    if (filters?.startDate) {
      queryBuilder.andWhere('review.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('review.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.verifierId) {
      queryBuilder.andWhere('review.verifierId = :verifierId', { verifierId: filters.verifierId });
    }

    const reviews = await queryBuilder.getMany();

    const stats = {
      total: reviews.length,
      pending: reviews.filter((r) => r.status === ReviewStatus.PENDING).length,
      inProgress: reviews.filter((r) => r.status === ReviewStatus.IN_PROGRESS).length,
      completed: reviews.filter((r) => r.status === ReviewStatus.COMPLETED).length,
      approved: reviews.filter((r) => r.decision === ReviewDecision.APPROVED).length,
      rejected: reviews.filter((r) => r.decision === ReviewDecision.REJECTED).length,
      needsInfo: reviews.filter((r) => r.decision === ReviewDecision.NEEDS_INFO).length,
      avgReviewTime: 0,
    };

    // Calculate average review time for completed reviews
    const completedReviews = reviews.filter(
      (r) => r.status === ReviewStatus.COMPLETED && r.completedAt && r.startedAt
    );

    if (completedReviews.length > 0) {
      const totalTime = completedReviews.reduce((sum, r) => {
        const time = r.completedAt!.getTime() - r.startedAt!.getTime();
        return sum + time;
      }, 0);
      stats.avgReviewTime = Math.round(totalTime / completedReviews.length / 1000 / 60); // in minutes
    }

    return stats;
  }

  /**
   * Get next review in queue for verifier
   */
  async getNextReview(verifierId: string): Promise<ManualReview | null> {
    const review = await this.reviewRepository.findOne({
      where: { status: ReviewStatus.PENDING },
      relations: ['certificate'],
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });

    if (review) {
      // Auto-assign to verifier
      await this.assignReview(review.id, verifierId);
    }

    return review;
  }
}

export default new ManualReviewService();