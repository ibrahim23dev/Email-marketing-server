import mongoose from 'mongoose';
import { TemplateRepository, templateRepository } from './template.repository';
import { ICreateTemplateDto, IUpdateTemplateDto, ITemplateResponse } from './template.dto';
import { TemplateMapper } from './template.mapper';
import { ValidationError, NotFoundError, ConflictError } from '../../shared/errors';
import { PaginationUtil } from '../../shared/pagination';
import { QueryBuilder } from '../../shared/query';
import { TEMPLATE_SEARCH_FIELDS, TEMPLATE_SORT_FIELDS } from './template.types';
import logger from '../../utils/logger';

// ============================================
// Template Service
// Time Complexity: O(log n) for single doc ops, O(n + m + f) for list ops
// ============================================

export class TemplateService {
  private repository: TemplateRepository;

  constructor(repository: TemplateRepository = templateRepository) {
    this.repository = repository;
  }

  /**
   * Get user ID from request
   * Time Complexity: O(1)
   */
  private getUserId(req: any): mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(req.user?.id);
  }

  /**
   * Get all templates with pagination, search, and filters
   * Time Complexity: O(n + m + f) where n is total docs, m is pagination, f is filters
   */
  async getTemplates(req: any): Promise<{ items: ITemplateResponse[]; pagination: any }> {
    const userId = this.getUserId(req);
    const { page, limit, skip } = PaginationUtil.getPaginationParams(req);
    const sort = QueryBuilder.parseSort(req, TEMPLATE_SORT_FIELDS);
    const search = QueryBuilder.parseSearch(req, TEMPLATE_SEARCH_FIELDS);
    const filters = QueryBuilder.parseFilters(req, ['category', 'isDefault']);

    // Build query
    const baseQuery: Record<string, unknown> = { userId };
    const query = QueryBuilder.buildQuery(baseQuery, search, filters);
    const sortObj = QueryBuilder.buildSort(sort) || { createdAt: -1 };

    // Execute queries in parallel
    const [templates, total] = await Promise.all([
      this.repository.findAll(userId, query, sortObj, skip, limit),
      this.repository.count(userId, query),
    ]);

    const items = TemplateMapper.toResponseList(templates);
    const pagination = PaginationUtil.calculateMeta(page, limit, total);

    return { items, pagination };
  }

  /**
   * Get template by ID
   * Time Complexity: O(log n) with index
   */
  async getTemplateById(req: any): Promise<ITemplateResponse> {
    const userId = this.getUserId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid template ID');
    }

    const template = await this.repository.findById(id, userId);

    if (!template) {
      throw new NotFoundError('Template');
    }

    return TemplateMapper.toResponse(template);
  }

  /**
   * Create a new template
   * Time Complexity: O(1) for insert
   */
  async createTemplate(req: any): Promise<ITemplateResponse> {
    const userId = this.getUserId(req);
    const { name, subject, body, category, thumbnail, isDefault, variables } = req.body;

    // Validation
    if (!name || !name.trim()) {
      throw new ValidationError('Template name is required', { field: 'name' });
    }
    if (!subject || !subject.trim()) {
      throw new ValidationError('Template subject is required', { field: 'subject' });
    }
    if (!body || !body.trim()) {
      throw new ValidationError('Template body is required', { field: 'body' });
    }

    const data: ICreateTemplateDto = {
      name: name.trim(),
      subject: subject.trim(),
      body,
      category: category || 'general',
      thumbnail,
      isDefault: isDefault || false,
      variables: variables || [],
    };

    const template = await this.repository.create(data, userId);
    logger.info(`Template created: ${template._id} for user: ${userId}`);

    return TemplateMapper.toResponse(template);
  }

  /**
   * Update a template
   * Time Complexity: O(log n) with index
   */
  async updateTemplate(req: any): Promise<ITemplateResponse> {
    const userId = this.getUserId(req);
    const { id } = req.params;
    const { name, subject, body, category, thumbnail, isDefault, variables } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid template ID');
    }

    const data: IUpdateTemplateDto = {};
    if (name !== undefined) {
      if (!name.trim()) throw new ValidationError('Template name cannot be empty', { field: 'name' });
      data.name = name.trim();
    }
    if (subject !== undefined) {
      if (!subject.trim()) throw new ValidationError('Template subject cannot be empty', { field: 'subject' });
      data.subject = subject.trim();
    }
    if (body !== undefined) data.body = body;
    if (category !== undefined) data.category = category;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (isDefault !== undefined) data.isDefault = isDefault;
    if (variables !== undefined) data.variables = variables;

    const template = await this.repository.update(id, userId, data);

    if (!template) {
      throw new NotFoundError('Template');
    }

    logger.info(`Template updated: ${id} for user: ${userId}`);

    return TemplateMapper.toResponse(template);
  }

  /**
   * Delete a template
   * Time Complexity: O(log n) with index
   */
  async deleteTemplate(req: any): Promise<void> {
    const userId = this.getUserId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid template ID');
    }

    const deleted = await this.repository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundError('Template');
    }

    logger.info(`Template deleted: ${id} for user: ${userId}`);
  }

  /**
   * Get default templates
   * Time Complexity: O(n) where n is number of default templates
   */
  async getDefaultTemplates(): Promise<ITemplateResponse[]> {
    const templates = await this.repository.findDefaults();
    return TemplateMapper.toResponseList(templates);
  }
}

// Export singleton instance
export const templateService = new TemplateService();
