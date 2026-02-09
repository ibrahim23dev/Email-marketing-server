import { Response } from 'express';
import crypto from 'crypto';

// ============================================
// API Response Types
// ============================================

export interface IPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// API Response Constants
// ============================================

export const API_VERSION = 'v1';
export const API_BASE_PATH = '/api/v1';

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
}

// ============================================
// Response Builder Class
// Time Complexity: O(1) for all operations
// ============================================

export class ApiResponseBuilder {
  private static generateRequestId(): string {
    return crypto.randomUUID();
  }

  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Creates a success response with data
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    message: string = 'Success'
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta: {
        requestId: this.generateRequestId(),
        timestamp: this.formatTimestamp(),
        version: API_VERSION,
      },
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Creates a paginated response
   * Time Complexity: O(1) for building the response object
   */
  static paginated<T>(
    res: Response,
    items: T[],
    pagination: { page: number; limit: number; total: number },
    message: string = 'Success'
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    const response: IApiResponse<T> = {
      success: true,
      statusCode: HttpStatusCode.OK,
      message,
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
      meta: {
        requestId: this.generateRequestId(),
        timestamp: this.formatTimestamp(),
        version: API_VERSION,
      },
    };

    return res.status(HttpStatusCode.OK).json(response);
  }

  /**
   * Creates a created response (201)
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, HttpStatusCode.CREATED, message);
  }

  /**
   * Creates a no content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatusCode.NO_CONTENT).send();
  }

  /**
   * Creates an error response
   * Time Complexity: O(1)
   */
  static error(
    res: Response,
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatusCode,
    details?: Record<string, unknown>
  ): Response {
    const response: Record<string, unknown> = {
      success: false,
      statusCode,
      message,
      meta: {
        requestId: this.generateRequestId(),
        timestamp: this.formatTimestamp(),
        version: API_VERSION,
      },
    };

    if (details) {
      response.error = {
        code: errorCode,
        message,
        details,
      };
    } else {
      response.error = {
        code: errorCode,
        message,
      };
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Validates required fields and returns error if missing
   * Time Complexity: O(n) where n is number of fields
   */
  static validateRequired(
    res: Response,
    fields: Record<string, unknown>,
    errorMessage: string = 'Missing required fields'
  ): Response | null {
    const missingFields = Object.entries(fields)
      .filter(([, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return this.error(
        res,
        ErrorCode.VALIDATION_ERROR,
        errorMessage,
        HttpStatusCode.BAD_REQUEST,
        { missingFields }
      );
    }

    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Removes MongoDB internal fields from documents
 * Time Complexity: O(n * m) where n is number of documents and m is fields to remove
 */
export function sanitizeDocuments<T extends Record<string, unknown>>(
  documents: T[],
  fieldsToRemove: string[] = ['__v', '_id']
): T[] {
  return documents.map((doc) => {
    const sanitized: Record<string, unknown> = { ...doc };
    fieldsToRemove.forEach((field) => delete sanitized[field]);
    return sanitized as T;
  });
}

/**
 * Formats pagination meta for response
 * Time Complexity: O(1)
 */
export function formatPaginationMeta(
  page: number,
  limit: number,
  total: number
): IPaginatedResponse<unknown>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export default ApiResponseBuilder;
