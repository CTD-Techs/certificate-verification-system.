import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a paginated success response
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): Response => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any[]
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 */
export const sendValidationError = (
  res: Response,
  details: any[]
): Response => {
  return sendError(
    res,
    'VALIDATION_ERROR',
    'Invalid input data',
    400,
    details
  );
};

/**
 * Send an unauthorized error response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Send a forbidden error response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, 'FORBIDDEN', message, 403);
};

/**
 * Send a not found error response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, 'NOT_FOUND', message, 404);
};

/**
 * Send a conflict error response
 */
export const sendConflict = (
  res: Response,
  message: string = 'Resource already exists'
): Response => {
  return sendError(res, 'CONFLICT', message, 409);
};

/**
 * Send a rate limit error response
 */
export const sendRateLimitError = (
  res: Response,
  retryAfter?: number
): Response => {
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter.toString());
  }
  return sendError(
    res,
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later.',
    429
  );
};