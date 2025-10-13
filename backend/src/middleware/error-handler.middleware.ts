import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';
import { sendError } from '../utils/response';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.sub,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return sendError(
      res,
      err.code,
      err.message,
      err.statusCode,
      'details' in err ? (err as any).details : undefined
    );
  }

  // Handle validation errors from libraries
  if (err.name === 'ValidationError') {
    return sendError(res, 'VALIDATION_ERROR', err.message, 400);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as any;
    logger.error('[VALIDATION] Zod validation failed:', {
      issues: zodError.issues,
      errors: zodError.errors,
      formattedErrors: zodError.format(),
    });
    
    const errorMessages = zodError.issues?.map((issue: any) =>
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ') || err.message;
    
    return sendError(
      res,
      'VALIDATION_ERROR',
      errorMessages,
      400,
      zodError.issues || []
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'UNAUTHORIZED', 'Token expired', 401);
  }

  // Handle database errors
  if (err.name === 'QueryFailedError') {
    return sendError(res, 'DATABASE_ERROR', 'Database operation failed', 500);
  }

  // Default to 500 server error
  return sendError(
    res,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500
  );
};

/**
 * Handle 404 Not Found
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return sendError(
    res,
    'NOT_FOUND',
    `Route ${req.method} ${req.url} not found`,
    404
  );
};