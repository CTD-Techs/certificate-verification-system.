import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../services/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../utils/error';
import { UserRole } from '../models';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[AUTH] Request path:', req.path);
    console.log('[AUTH] Content-Type:', req.headers['content-type']);
    console.log('[AUTH] Authorization header present:', !!req.headers.authorization);
    
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.log('[AUTH] No token found in Authorization header');
      throw new UnauthorizedError('No authentication token provided');
    }

    const payload = verifyToken(token);
    req.user = payload;
    
    console.log('[AUTH] User authenticated:', { userId: payload.sub, role: payload.role });
    next();
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};