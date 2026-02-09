import mongoose from 'mongoose';
import Template from '../../models/template.model';
import { ITemplate } from './template.types';
import { ICreateTemplateDto, IUpdateTemplateDto } from './template.dto';

// ============================================
// Template Repository
// Time Complexity: O(log n) for single doc ops, O(n) for list ops
// ============================================

export class TemplateRepository {
  private model: mongoose.Model<ITemplate>;

  constructor() {
    this.model = Template;
  }

  /**
   * Find template by ID for a specific user
   * Time Complexity: O(log n) with index
   */
  async findById(id: string, userId: mongoose.Types.ObjectId): Promise<ITemplate | null> {
    return this.model.findOne({ _id: id, userId }).lean() as Promise<ITemplate | null>;
  }

  /**
   * Find all templates for a user with pagination
   * Time Complexity: O(n + m + f) where n is total docs, m is pagination, f is filters
   */
  async findAll(
    userId: mongoose.Types.ObjectId,
    query: Record<string, unknown>,
    sort: Record<string, 1 | -1>,
    skip: number,
    limit: number
  ): Promise<ITemplate[]> {
    return this.model.find(query).sort(sort).skip(skip).limit(limit).lean() as Promise<ITemplate[]>;
  }

  /**
   * Count templates for a user
   * Time Complexity: O(n) where n is total docs
   */
  async count(userId: mongoose.Types.ObjectId, query: Record<string, unknown>): Promise<number> {
    return this.model.countDocuments({ ...query, userId });
  }

  /**
   * Create a new template
   * Time Complexity: O(1) for insert
   */
  async create(data: ICreateTemplateDto, userId: mongoose.Types.ObjectId): Promise<ITemplate> {
    return this.model.create({ ...data, userId }) as Promise<ITemplate>;
  }

  /**
   * Update a template
   * Time Complexity: O(log n) with index
   */
  async update(id: string, userId: mongoose.Types.ObjectId, data: IUpdateTemplateDto): Promise<ITemplate | null> {
    return this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    ).lean() as Promise<ITemplate | null>;
  }

  /**
   * Delete a template
   * Time Complexity: O(log n) with index
   */
  async delete(id: string, userId: mongoose.Types.ObjectId): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  /**
   * Find default templates (system-wide)
   * Time Complexity: O(n) where n is number of default templates
   */
  async findDefaults(): Promise<ITemplate[]> {
    return this.model.find({ isDefault: true }).lean() as Promise<ITemplate[]>;
  }

  /**
   * Find templates by category
   * Time Complexity: O(n) where n is number of templates in category
   */
  async findByCategory(userId: mongoose.Types.ObjectId, category: string): Promise<ITemplate[]> {
    return this.model.find({ userId, category }).lean() as Promise<ITemplate[]>;
  }
}

// Export singleton instance
export const templateRepository = new TemplateRepository();
