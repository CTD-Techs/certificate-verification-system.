import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog, EntityType } from '../models';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';

const auditRepository = AppDataSource.getRepository(AuditLog);

/**
 * Get audit logs
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = auditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC');

    // Apply filters
    if (req.query.entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', {
        entityType: req.query.entityType,
      });
    }

    if (req.query.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', {
        entityId: req.query.entityId,
      });
    }

    if (req.query.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: req.query.action,
      });
    }

    if (req.query.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: req.query.userId,
      });
    }

    if (req.query.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: new Date(req.query.startDate as string),
      });
    }

    if (req.query.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: new Date(req.query.endDate as string),
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const logs = await queryBuilder.skip(skip).take(limit).getMany();

    sendPaginatedSuccess(
      res,
      logs,
      { page, limit, total },
      'Audit logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await auditRepository.findOne({
      where: { id },
    });

    if (!log) {
      sendSuccess(res, null, 'Audit log not found', 404);
      return;
    }

    sendSuccess(res, log, 'Audit log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for specific entity
 */
export const getEntityAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await auditRepository.findAndCount({
      where: {
        entityType: entityType as EntityType,
        entityId,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    sendPaginatedSuccess(
      res,
      logs,
      { page, limit, total },
      'Entity audit logs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryBuilder = auditRepository.createQueryBuilder('audit');

    if (req.query.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: new Date(req.query.startDate as string),
      });
    }

    if (req.query.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: new Date(req.query.endDate as string),
      });
    }

    const logs = await queryBuilder.getMany();

    // Group by action
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Group by entity type
    const entityTypeCounts: Record<string, number> = {};
    logs.forEach((log) => {
      entityTypeCounts[log.entityType] = (entityTypeCounts[log.entityType] || 0) + 1;
    });

    // Get unique users
    const uniqueUsers = new Set(logs.map((log) => log.userId).filter(Boolean));

    const stats = {
      total: logs.length,
      byAction: actionCounts,
      byEntityType: entityTypeCounts,
      uniqueUsers: uniqueUsers.size,
      dateRange: {
        start: req.query.startDate || null,
        end: req.query.endDate || null,
      },
    };

    sendSuccess(res, stats, 'Audit statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};