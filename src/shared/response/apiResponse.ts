import { Response } from 'express';
import crypto from 'crypto';

// ============================================
// API Response Types
// ============================================

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pagination?: IPaginationMeta;
  meta: IApiMeta;
}

export interface IErrorResponse {
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
// API Response Builder
// Time Complexity: O(1) for all methods
// ============================================

export class ApiResponseBuilder {
  private static generateMeta(): IApiMeta {
    return {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    };
  }

  /**
   * Build success response
   * Time Complexity: O(1)
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    message: string = 'Success'
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      meta: this.generateMeta(),
    });
  }

  /**
   * Build created response
   * Time Complexity: O(1)
   */
  static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
    return this.success(res, data, HttpStatusCode.CREATED, message);
  }

  /**
   * Build no content response
   * Time Complexity: O(1)
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatusCode.NO_CONTENT).json({
      success: true,
      statusCode: HttpStatusCode.NO_CONTENT,
      message: 'No content',
      meta: this.generateMeta(),
    });
  }

  /**
   * Build paginated response
   * Time Complexity: O(1)
   */
  static paginated<T>(
    res: Response,
    items: T[],
    pagination: IPaginationMeta,
    message: string = 'Success'
  ): Response {
    return res.status(HttpStatusCode.OK).json({
      success: true,
      statusCode: HttpStatusCode.OK,
      message,
      data: { items },
      pagination,
      meta: this.generateMeta(),
    });
  }

  /**
   * Build error response
   * Time Complexity: O(1)
   */
  static error(
    res: Response,
    statusCode: HttpStatusCode,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: {
        code,
        message,
        details,
      },
      meta: this.generateMeta(),
    });
  }
}
