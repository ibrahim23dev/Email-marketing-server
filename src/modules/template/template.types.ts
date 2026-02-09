import mongoose from 'mongoose';
import Template from '../../models/template.model';

// ============================================
// Template Types
// ============================================

export enum TemplateCategory {
  GENERAL = 'general',
  MARKETING = 'marketing',
  NEWSLETTER = 'newsletter',
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional',
  WELCOME = 'welcome',
  ONBOARDING = 'onboarding',
}

export interface ITemplate extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  body: string;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Template Model Type
// ============================================

export type TemplateModel = typeof Template & mongoose.Model<ITemplate>;

// ============================================
// Template Constants
// ============================================

export const TEMPLATE_ALLOWED_FIELDS = ['name', 'subject', 'body', 'category', 'thumbnail', 'isDefault', 'variables', 'createdAt', 'updatedAt'];

export const TEMPLATE_SEARCH_FIELDS = ['name', 'subject'];

export const TEMPLATE_SORT_FIELDS = ['name', 'subject', 'category', 'createdAt', 'updatedAt'];

export const TEMPLATE_FILTER_FIELDS = ['category', 'isDefault'];
