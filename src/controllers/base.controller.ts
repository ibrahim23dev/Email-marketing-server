import { Response } from 'express';
import { Request } from 'express';
import mongoose from 'mongoose';
import { ApiResponseBuilder, HttpStatusCode } from '../utils/apiResponse';
import {
  QueryParser,
  MongoQueryBuilder,
  getPaginationParams,
  calculatePaginationMeta,
} from '../utils/queryParser';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler.middleware';
import logger from '../utils/logger';

// ============================================
// Base Controller Types
// ============================================

export interface IControllerOptions<T> {
  model: mongoose.Model<T>;
  modelName: string;
  allowedSortFields: (keyof T)[];
  searchFields: (keyof T)[];
  filterableFields: (keyof T)[];
  fieldsToSanitize?: string[];
}

// ============================================
// Base Controller Class
// Time Complexity: O(log n) for single document ops, O(n) for list ops
// ============================================

export abstract class BaseController<T extends Record<string, unknown>> {
  protected readonly model: mongoose.Model<T>;
  protected readonly modelName: string;
  protected readonly allowedSortFields: (keyof T)[];
  protected readonly searchFields: (keyof T)[];
  protected readonly filterableFields: (keyof T)[];
  protected readonly fieldsToSanitize: string[];

  constructor(options: IControllerOptions<T>) {
    this.model = options.model;
    this.modelName = options.modelName;
    this.allowedSortFields = options.allowedSortFields as (keyof T)[];
    this.searchFields = options.searchFields as (keyof T)[];
    this.filterableFields = options.filterableFields as (keyof T)[];
    this.fieldsToSanitize = options.fieldsToSanitize || ['__v', '_id'];
  }

  /**
   * Get user ID from authenticated request
   * Time Complexity: O(1)
   */
  protected getUserId(req: Request): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId((req as { user?: { id: string } }).user?.id);
  }

  /**
   * Sanitize a document by removing internal fields
   * Time Complexity: O(f) where f is number of fields to sanitize
   */
  protected sanitizeDocument(doc: Record<string, unknown>): T {
    const sanitized = { ...doc };
    this.fieldsToSanitize.forEach((field) => delete sanitized[field]);
    return sanitized as T;
  }

  /**
   * Get all documents with pagination, search, and filters
   * Time Complexity: O(n + m + f) for query execution
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { page, limit, skip } = getPaginationParams(req);
      const sort = QueryParser.parseSort(req, this.allowedSortFields as string[]);
      const search = QueryParser.parseSearch(req, this.searchFields as string[]);
      const filters = QueryParser.parseFilters(req, this.filterableFields as string[]);

      // Build query with user filter
      const baseQuery: Record<string, unknown> = { userId };
      const query = MongoQueryBuilder.buildQuery(baseQuery, search, filters);
      const sortObj = MongoQueryBuilder.buildSort(sort);

      // Execute query with Promise.all for performance
      const [documents, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sortObj || { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.model.countDocuments(query),
      ]);

      // Sanitize documents (remove internal fields)
      const sanitizedDocs = documents.map((doc) => this.sanitizeDocument(doc));

      const paginationMeta = calculatePaginationMeta(page, limit, total);

      return ApiResponseBuilder.paginated(res, sanitizedDocs, paginationMeta);
    } catch (error) {
      logger.error(`Get all ${this.modelName} error:`, error);
      throw error;
    }
  }

  /**
   * Get single document by ID
   * Time Complexity: O(log n) with index
   */
  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid ${this.modelName} ID`);
      }

      const document = await this.model.findOne({ _id: id, userId }).lean();

      if (!document) {
        throw new NotFoundError(this.modelName);
      }

      // Sanitize document
      const sanitized = this.sanitizeDocument(document);

      return ApiResponseBuilder.success(res, sanitized);
    } catch (error) {
      logger.error(`Get ${this.modelName} by ID error:`, error);
      throw error;
    }
  }

  /**
   * Create new document
   * Time Complexity: O(1) for insert
   */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const documentData = { ...req.body, userId };

      const created = await this.model.create(documentData);
      const doc = Array.isArray(created) ? created[0] : created;

      // Sanitize document
      const sanitized = this.sanitizeDocument(doc.toObject());

      return ApiResponseBuilder.created(res, sanitized, `${this.modelName} created successfully`);
    } catch (error) {
      logger.error(`Create ${this.modelName} error:`, error);
      throw error;
    }
  }

  /**
   * Update document by ID
   * Time Complexity: O(log n) for find + O(1) for update
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const updates = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid ${this.modelName} ID`);
      }

      // Check if document exists and belongs to user
      const existingDoc = await this.model.findOne({ _id: id, userId });
      if (!existingDoc) {
        throw new NotFoundError(this.modelName);
      }

      // Prevent updating protected fields
      const protectedFields = ['_id', 'userId', 'createdAt'];
      protectedFields.forEach((field) => delete updates[field]);

      const updatedDoc = await this.model.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();

      // Sanitize document
      const sanitized = this.sanitizeDocument(updatedDoc || {});

      return ApiResponseBuilder.success(res, sanitized, undefined, `${this.modelName} updated successfully`);
    } catch (error) {
      logger.error(`Update ${this.modelName} error:`, error);
      throw error;
    }
  }

  /**
   * Delete document by ID
   * Time Complexity: O(log n) for find + O(1) for delete
   */
  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid ${this.modelName} ID`);
      }

      // Check if document exists and belongs to user
      const existingDoc = await this.model.findOne({ _id: id, userId });
      if (!existingDoc) {
        throw new NotFoundError(this.modelName);
      }

      await this.model.findByIdAndDelete(id);

      return ApiResponseBuilder.success(res, {} as T, HttpStatusCode.OK, `${this.modelName} deleted successfully`);
    } catch (error) {
      logger.error(`Delete ${this.modelName} error:`, error);
      throw error;
    }
  }
}

export default BaseController;
