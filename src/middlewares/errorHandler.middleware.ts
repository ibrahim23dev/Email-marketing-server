import { Request, Response, NextFunction } from 'express';
import { ErrorCode, HttpStatusCode } from '../utils/apiResponse';
import logger from '../utils/logger';

// ============================================
// Custom API Error Class
// ============================================

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: HttpStatusCode,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// Error Types
// ============================================

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(HttpStatusCode.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(HttpStatusCode.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR, message);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(HttpStatusCode.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(entity: string = 'Resource') {
    super(HttpStatusCode.NOT_FOUND, ErrorCode.NOT_FOUND, `${entity} not found`);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(HttpStatusCode.CONFLICT, ErrorCode.CONFLICT, message);
  }
}

export class InternalError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, message);
  }
}

// ============================================
// Error Handler Middleware
// Time Complexity: O(1) for handling
// ============================================

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    code: err instanceof ApiError ? err.code : 'UNKNOWN_ERROR',
    path: req.path,
    method: req.method,
  });

  // Default values
  let statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
  let message: string = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = HttpStatusCode.BAD_REQUEST;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed';
    details = { validationErrors: parseValidationError(err) };
  }
  // Handle Mongoose cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = HttpStatusCode.BAD_REQUEST;
    code = ErrorCode.BAD_REQUEST;
    message = 'Invalid ID format';
  }
  // Handle duplicate key errors
  else if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    statusCode = HttpStatusCode.CONFLICT;
    code = ErrorCode.CONFLICT;
    message = 'Duplicate entry';
    details = parseDuplicateKeyError(err);
  }
  // Handle JSON parse errors
  else if (err instanceof SyntaxError && 'status' in err && (err as unknown as { status: number }).status === 400) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    code = ErrorCode.BAD_REQUEST;
    message = 'Invalid JSON';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    meta: {
      requestId: req.headers['x-request-id'] || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};

// ============================================
// Async Handler Wrapper
// Time Complexity: O(1)
// ============================================

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// Not Found Handler
// Time Complexity: O(1)
// ============================================

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatusCode.NOT_FOUND).json({
    success: false,
    statusCode: HttpStatusCode.NOT_FOUND,
    message: `Route ${req.method} ${req.path} not found`,
    meta: {
      requestId: req.headers['x-request-id'] || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
    error: {
      code: ErrorCode.NOT_FOUND,
      message: 'Endpoint not found',
    },
  });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Parse Mongoose validation error
 * Time Complexity: O(n) for n validation errors
 */
function parseValidationError(error: Error): Record<string, string> {
  const validationErrors: Record<string, string> = {};
  
  if ('errors' in error) {
    const mongooseError = error as { errors: Record<string, { message: string }> };
    for (const [key, value] of Object.entries(mongooseError.errors)) {
      validationErrors[key] = value.message;
    }
  }
  
  return validationErrors;
}

/**
 * Parse MongoDB duplicate key error
 * Time Complexity: O(1)
 */
function parseDuplicateKeyError(error: Error): Record<string, string> {
  const duplicateFields: Record<string, string> = {};
  
  if ('keyValue' in error) {
    const keyValue = (error as unknown as { keyValue: Record<string, string> }).keyValue;
    for (const [key, value] of Object.entries(keyValue)) {
      duplicateFields[key] = `A record with '${value}' already exists for ${key}`;
    }
  }
  
  return duplicateFields;
}

export default errorHandler;
