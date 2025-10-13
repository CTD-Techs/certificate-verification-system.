import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth/auth.service';
import { verifyToken, generateAccessToken } from '../services/auth/jwt.service';
import { sendSuccess } from '../utils/response';
import logger from '../utils/logger';

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    
    logger.info('User registered', { userId: result.user.id, email: result.user.email });
    
    sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    
    logger.info('User logged in', { userId: result.user.id, email: result.user.email });
    
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    // Verify refresh token
    const payload = verifyToken(refreshToken);
    
    // Get user
    const user = await authService.getUserById(payload.sub);
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    
    logger.info('Token refreshed', { userId: user.id });
    
    sendSuccess(res, {
      token: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a real implementation, you might want to:
    // - Blacklist the token
    // - Clear session data
    // - Revoke refresh token
    
    logger.info('User logged out', { userId: req.user?.sub });
    
    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getUserById(req.user!.sub);
    
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.updateProfile(req.user!.sub, req.body);
    
    logger.info('Profile updated', { userId: user.id });
    
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(req.user!.sub, currentPassword, newPassword);
    
    logger.info('Password changed', { userId: req.user!.sub });
    
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};