import { Request } from 'express';

// ============================================
// Pagination Types
// ============================================

export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// Pagination Defaults
// ============================================

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ============================================
// Pagination Utilities
// Time Complexity: O(1) for all methods
// ============================================

export class PaginationUtil {
  /**
   * Parse and validate pagination parameters from request
   * Time Complexity: O(1)
   */
  static getPaginationParams(req: Request): IPaginationOptions {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    const page = this.parsePositiveInt(rawPage, PAGINATION_DEFAULTS.DEFAULT_PAGE);
    const limit = this.parsePositiveInt(rawLimit, PAGINATION_DEFAULTS.DEFAULT_LIMIT);

    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);

    return {
      page: validatedPage,
      limit: validatedLimit,
      skip: (validatedPage - 1) * validatedLimit,
    };
  }

  /**
   * Calculate pagination metadata
   * Time Complexity: O(1)
   */
  static calculateMeta(page: number, limit: number, total: number): IPaginationMeta {
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

  /**
   * Parse positive integer with default
   * Time Complexity: O(1)
   */
  private static parsePositiveInt(value: any, defaultValue: number): number {
    if (!value) return defaultValue;
    const strValue = Array.isArray(value) ? value[0] : value;
    if (!strValue) return defaultValue;
    const parsed = parseInt(strValue, 10);
    return isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
  }
}
