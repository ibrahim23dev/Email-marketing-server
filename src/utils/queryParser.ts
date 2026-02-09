import { Request } from 'express';

// ============================================
// Pagination Types
// ============================================

export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface ISortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface ISearchOptions {
  fields: string[];
  value: string;
}

export interface IFilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
  value: unknown;
}

export interface IQueryParams {
  pagination: IPaginationOptions;
  sort: ISortOptions | null;
  search: ISearchOptions | null;
  filters: IFilterOptions[];
  raw: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    [key: string]: unknown;
  };
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
// Query Parser Class
// Time Complexity: O(n) for parsing n query parameters
// ============================================

class QueryParser {
  private static readonly ALLOWED_SORT_FIELDS: string[] = [];
  private static readonly ALLOWED_SEARCH_FIELDS: string[] = [];

  /**
   * Parse and validate pagination parameters
   * Time Complexity: O(1)
   */
  static parsePagination(req: Request): IPaginationOptions {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    const page = this.parsePositiveInt(rawPage, PAGINATION_DEFAULTS.DEFAULT_PAGE);
    const limit = this.parsePositiveInt(rawLimit, PAGINATION_DEFAULTS.DEFAULT_LIMIT);

    return {
      page: Math.max(1, page),
      limit: Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT),
      skip: (Math.max(1, page) - 1) * Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT),
    };
  }

  /**
   * Parse and validate sort parameters
   * Time Complexity: O(1)
   */
  static parseSort(req: Request, allowedFields: string[]): ISortOptions | null {
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    if (!sortBy) return null;

    const field = allowedFields.includes(sortBy) ? sortBy : allowedFields[0];
    const order = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    return { field, order };
  }

  /**
   * Parse and validate search parameters
   * Time Complexity: O(m) where m is number of search fields
   */
  static parseSearch(req: Request, searchFields: string[]): ISearchOptions | null {
    const search = req.query.search as string | undefined;

    if (!search || typeof search !== 'string' || search.trim() === '') {
      return null;
    }

    // Only allow searching in predefined fields
    const allowedFields = searchFields.filter((f) => this.ALLOWED_SEARCH_FIELDS.includes(f));

    if (allowedFields.length === 0) {
      return null;
    }

    return {
      fields: allowedFields,
      value: search.trim(),
    };
  }

  /**
   * Parse filter parameters from query
   * Time Complexity: O(n) where n is number of filterable fields
   */
  static parseFilters(req: Request, filterableFields: string[]): IFilterOptions[] {
    const filters: IFilterOptions[] = [];
    const excludedParams = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];

    for (const field of filterableFields) {
      const value = req.query[field];

      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Determine operator based on field name convention or value format
      const operator = this.determineOperator(field, value);

      filters.push({
        field,
        operator,
        value: this.parseFilterValue(value, operator),
      });
    }

    return filters;
  }

  /**
   * Build complete query params object
   * Time Complexity: O(n + m + f) where n=pagination, m=sort, f=filters
   */
  static parseQuery<T extends string>(
    req: Request,
    options: {
      allowedSortFields?: T[];
      searchFields?: T[];
      filterableFields?: T[];
    }
  ): IQueryParams {
    const {
      allowedSortFields = [],
      searchFields = [],
      filterableFields = [],
    } = options;

    const allowedSort = allowedSortFields.length > 0 ? allowedSortFields : [''];
    const search = searchFields.length > 0 ? searchFields : [''];
    const filters = filterableFields.length > 0 ? filterableFields : [''];

    return {
      pagination: this.parsePagination(req),
      sort: this.parseSort(req, allowedSort),
      search: this.parseSearch(req, search),
      filters: this.parseFilters(req, filters),
      raw: {
        page: Number(req.query.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE,
        limit: Number(req.query.limit) || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
        ...req.query,
      },
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private static parsePositiveInt(value: unknown, defaultValue: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
  }

  private static determineOperator(field: string, value: unknown): IFilterOptions['operator'] {
    // Check for special prefix in field name
    if (field.endsWith('_gt')) return 'gt';
    if (field.endsWith('_gte')) return 'gte';
    if (field.endsWith('_lt')) return 'lt';
    if (field.endsWith('_lte')) return 'lte';
    if (field.endsWith('_ne')) return 'ne';
    if (field.endsWith('_in')) return 'in';
    if (field.endsWith('_nin')) return 'nin';

    return 'eq';
  }

  private static parseFilterValue(
    value: unknown,
    operator: IFilterOptions['operator']
  ): unknown {
    if (operator === 'in' || operator === 'nin') {
      if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim());
      }
      return value;
    }

    if (typeof value === 'string' && operator === 'regex') {
      return value;
    }

    // Try to parse as JSON for complex values
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }
}

// ============================================
// MongoDB Query Builder
// Time Complexity: O(n + m + f) where n=baseQuery keys, m=search fields, f=filters
// ============================================

class MongoQueryBuilder {
  /**
   * Build search query for multiple fields (case-insensitive)
   * Time Complexity: O(n) for n fields
   */
  static buildSearchQuery(search: ISearchOptions | null): Record<string, unknown> | null {
    if (!search || search.fields.length === 0 || !search.value) {
      return null;
    }

    const searchConditions = search.fields.map((field) => ({
      [field]: { $regex: search.value, $options: 'i' },
    }));

    return { $or: searchConditions };
  }

  /**
   * Build filter queries
   * Time Complexity: O(f) for f filters
   */
  static buildFilterQuery(filters: IFilterOptions[]): Record<string, unknown> | null {
    if (filters.length === 0) {
      return null;
    }

    const filterConditions: Record<string, unknown> = {};

    for (const filter of filters) {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'eq':
          filterConditions[field] = value;
          break;
        case 'ne':
          filterConditions[field] = { $ne: value };
          break;
        case 'gt':
          filterConditions[field] = { $gt: value };
          break;
        case 'gte':
          filterConditions[field] = { $gte: value };
          break;
        case 'lt':
          filterConditions[field] = { $lt: value };
          break;
        case 'lte':
          filterConditions[field] = { $lte: value };
          break;
        case 'in':
          filterConditions[field] = { $in: value };
          break;
        case 'nin':
          filterConditions[field] = { $nin: value };
          break;
        case 'regex':
          filterConditions[field] = { $regex: value, $options: 'i' };
          break;
      }
    }

    return filterConditions;
  }

  /**
   * Build complete MongoDB query with all conditions
   * Time Complexity: O(n + m + f) where n=baseQuery keys, m=search fields, f=filters
   */
  static buildQuery(
    baseQuery: Record<string, unknown>,
    search: ISearchOptions | null,
    filters: IFilterOptions[]
  ): Record<string, unknown> {
    const searchQuery = this.buildSearchQuery(search);
    const filterQuery = this.buildFilterQuery(filters);

    if (!searchQuery && !filterQuery) {
      return baseQuery;
    }

    const combinedQuery: Record<string, unknown> = { ...baseQuery };

    if (searchQuery) {
      combinedQuery.$and = combinedQuery.$and || [];
      (combinedQuery.$and as unknown[]).push(searchQuery);
    }

    if (filterQuery) {
      combinedQuery.$and = combinedQuery.$and || [];
      (combinedQuery.$and as unknown[]).push(filterQuery);
    }

    return combinedQuery;
  }

  /**
   * Build sort object for MongoDB
   * Time Complexity: O(1)
   */
  static buildSort(sort: ISortOptions | null): Record<string, 1 | -1> | null {
    if (!sort) return null;
    return { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }
}

// ============================================
// Pagination Helper Functions
// ============================================

/**
 * Calculate pagination metadata
 * Time Complexity: O(1)
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
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
 * Parse pagination from request with defaults
 * Time Complexity: O(1)
 */
export function getPaginationParams(req: Request): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = parseInt(req.query.page as string) || PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(req.query.limit as string) || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
    PAGINATION_DEFAULTS.MAX_LIMIT
  );

  return {
    page: Math.max(1, page),
    limit,
    skip: (Math.max(1, page) - 1) * limit,
  };
}

// Export classes and functions
export { QueryParser, MongoQueryBuilder };
