import { Request } from 'express';

// ============================================
// Query Builder Types
// ============================================

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

// ============================================
// Query Builder Class
// Time Complexity: O(n) for parsing n query parameters
// ============================================

export class QueryBuilder {
  private static readonly ALLOWED_SORT_FIELDS: string[] = [];

  /**
   * Parse sort parameters from request
   * Time Complexity: O(1)
   */
  static parseSort(req: Request, allowedFields: string[]): ISortOptions | null {
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;

    if (!sortBy) return null;

    const field = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    return { field, order };
  }

  /**
   * Parse search parameters from request
   * Time Complexity: O(n) where n is number of search fields
   */
  static parseSearch(req: Request, searchFields: string[]): ISearchOptions | null {
    const search = req.query.search as string | undefined;

    if (!search || searchFields.length === 0) return null;

    return {
      fields: searchFields,
      value: search,
    };
  }

  /**
   * Parse filter parameters from request
   * Time Complexity: O(n) where n is number of filterable fields
   */
  static parseFilters(req: Request, filterableFields: string[]): IFilterOptions[] {
    const filters: IFilterOptions[] = [];

    for (const field of filterableFields) {
      const value = req.query[field];
      if (value !== undefined && value !== '') {
        filters.push({
          field,
          operator: 'eq',
          value,
        });
      }
    }

    return filters;
  }

  /**
   * Build MongoDB query object from search and filters
   * Time Complexity: O(n + m) where n is search fields, m is filters
   */
  static buildQuery(
    baseQuery: Record<string, unknown>,
    search: ISearchOptions | null,
    filters: IFilterOptions[]
  ): Record<string, unknown> {
    const query: Record<string, unknown> = { ...baseQuery };

    // Add search conditions
    if (search && search.fields.length > 0) {
      query.$or = search.fields.map((field) => ({
        [field]: { $regex: search.value, $options: 'i' },
      }));
    }

    // Add filter conditions
    for (const filter of filters) {
      query[filter.field] = this.applyFilterOperator(filter);
    }

    return query;
  }

  /**
   * Build MongoDB sort object
   * Time Complexity: O(1)
   */
  static buildSort(sort: ISortOptions | null): Record<string, 1 | -1> | null {
    if (!sort) return null;
    return { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }

  /**
   * Apply filter operator to value
   * Time Complexity: O(1)
   */
  private static applyFilterOperator(filter: IFilterOptions): unknown {
    switch (filter.operator) {
      case 'eq':
        return filter.value;
      case 'ne':
        return { $ne: filter.value };
      case 'gt':
        return { $gt: filter.value };
      case 'gte':
        return { $gte: filter.value };
      case 'lt':
        return { $lt: filter.value };
      case 'lte':
        return { $lte: filter.value };
      case 'in':
        return { $in: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case 'nin':
        return { $nin: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case 'regex':
        return { $regex: String(filter.value), $options: 'i' };
      default:
        return filter.value;
    }
  }
}
