import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

/**
 * Middleware to validate request using Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendValidationError(res, details);
      }
      return next(error);
    }
  };
};

export * from './auth.validator';
export * from './certificate.validator';
export * from './verification.validator';
export * from './verifier.validator';