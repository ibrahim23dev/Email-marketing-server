import { Request, Response } from 'express';
import { templateService } from './template.service';
import { asyncHandler } from '../../shared/errors';
import { ApiResponseBuilder } from '../../shared/response';

// ============================================
// Template Controller
// Time Complexity: O(log n) for single doc ops, O(n + m + f) for list ops
// ============================================

/**
 * GET /templates
 * Get all templates with pagination, search, and filters
 * Time Complexity: O(n + m + f)
 */
export const getTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { items, pagination } = await templateService.getTemplates(req);
  ApiResponseBuilder.paginated(res, items, pagination, 'Templates retrieved successfully');
});

/**
 * GET /templates/default
 * Get all default (system) templates
 * Time Complexity: O(n)
 */
export const getDefaultTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const templates = await templateService.getDefaultTemplates();
  ApiResponseBuilder.paginated(res, templates, {
    page: 1,
    limit: templates.length,
    total: templates.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  }, 'Default templates retrieved successfully');
});

/**
 * GET /templates/:id
 * Get template by ID
 * Time Complexity: O(log n)
 */
export const getTemplateById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const template = await templateService.getTemplateById(req);
  ApiResponseBuilder.success(res, template, 200, 'Template retrieved successfully');
});

/**
 * POST /templates
 * Create a new template
 * Time Complexity: O(1)
 */
export const createTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const template = await templateService.createTemplate(req);
  ApiResponseBuilder.created(res, template, 'Template created successfully');
});

/**
 * PUT /templates/:id
 * Update a template
 * Time Complexity: O(log n)
 */
export const updateTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const template = await templateService.updateTemplate(req);
  ApiResponseBuilder.success(res, template, 200, 'Template updated successfully');
});

/**
 * DELETE /templates/:id
 * Delete a template
 * Time Complexity: O(log n)
 */
export const deleteTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await templateService.deleteTemplate(req);
  ApiResponseBuilder.success(res, null, 200, 'Template deleted successfully');
});
