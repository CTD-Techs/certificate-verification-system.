import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

/**
 * Middleware to validate request using Zod schema
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      console.log('[VALIDATOR] ===== VALIDATION REQUEST =====');
      console.log('[VALIDATOR] Request body:', JSON.stringify(req.body, null, 2));
      console.log('[VALIDATOR] Request query:', JSON.stringify(req.query, null, 2));
      console.log('[VALIDATOR] Request params:', JSON.stringify(req.params, null, 2));
      
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      console.log('[VALIDATOR] ===== VALIDATION PASSED =====');
      return next();
    } catch (error) {
      console.log('[VALIDATOR] ===== VALIDATION ERROR =====');
      console.log('[VALIDATOR] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      
      if (error instanceof ZodError) {
        console.log('[VALIDATOR] Zod validation errors:', JSON.stringify(error.errors, null, 2));
        console.log('[VALIDATOR] Error issues:', JSON.stringify(error.issues, null, 2));
        console.log('[VALIDATOR] Formatted errors:');
        error.errors.forEach((err, index) => {
          console.log(`[VALIDATOR]   ${index + 1}. Path: ${err.path.join('.')}`);
          console.log(`[VALIDATOR]      Message: ${err.message}`);
          console.log(`[VALIDATOR]      Code: ${err.code}`);
          console.log(`[VALIDATOR]      Received: ${JSON.stringify(err)}`);
        });
        
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendValidationError(res, details);
      }
      
      console.log('[VALIDATOR] Non-Zod error:', error);
      return next(error);
    }
  };
};

export * from './auth.validator';
export * from './certificate.validator';
export * from './verification.validator';
export * from './verifier.validator';
export * from './identity.validator';