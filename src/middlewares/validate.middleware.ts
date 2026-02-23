import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

export const validate = (schema: ZodSchema) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(400, `Validation Failed: ${errors}`));
      } else {
        next(error);
      }
    }
};
