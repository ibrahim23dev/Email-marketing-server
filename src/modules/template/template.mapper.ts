import mongoose from 'mongoose';
import { ITemplate } from './template.types';
import { ITemplateResponse } from './template.dto';

// ============================================
// Fields to exclude from API responses
// ============================================

const INTERNAL_FIELDS = ['__v', '_id'];

// ============================================
// Template Mapper
// Time Complexity: O(f) where f is number of fields
// ============================================

export class TemplateMapper {
  /**
   * Map template document to response DTO
   * Time Complexity: O(f) where f is number of fields
   */
  static toResponse(doc: ITemplate | Record<string, unknown>): ITemplateResponse {
    const sanitized: Record<string, unknown> = { ...doc };
    
    // Remove internal fields
    INTERNAL_FIELDS.forEach((field) => delete sanitized[field]);
    
    // Convert _id to id
    if (sanitized._id) {
      sanitized.id = String(sanitized._id);
      delete sanitized._id;
    }
    
    // Ensure dates are strings
    if (sanitized.createdAt instanceof Date) {
      sanitized.createdAt = sanitized.createdAt.toISOString();
    }
    if (sanitized.updatedAt instanceof Date) {
      sanitized.updatedAt = sanitized.updatedAt.toISOString();
    }
    
    return sanitized as unknown as ITemplateResponse;
  }

  /**
   * Map multiple templates to response DTOs
   * Time Complexity: O(n * f) where n is number of templates
   */
  static toResponseList(docs: (ITemplate | Record<string, unknown>)[]): ITemplateResponse[] {
    return docs.map((doc) => this.toResponse(doc));
  }

  /**
   * Sanitize template object (remove internal fields)
   * Time Complexity: O(f) where f is number of fields
   */
  static sanitize(doc: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...doc };
    INTERNAL_FIELDS.forEach((field) => delete sanitized[field]);
    return sanitized;
  }
}
