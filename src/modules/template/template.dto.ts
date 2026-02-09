import { TemplateCategory } from './template.types';

// ============================================
// Template DTOs
// ============================================

export interface ICreateTemplateDto {
  name: string;
  subject: string;
  body: string;
  category?: TemplateCategory | string;
  thumbnail?: string;
  isDefault?: boolean;
  variables?: string[];
}

export interface IUpdateTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  category?: TemplateCategory | string;
  thumbnail?: string;
  isDefault?: boolean;
  variables?: string[];
}

// ============================================
// Template Response Types
// ============================================

export interface ITemplateResponse {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  thumbnail?: string;
  isDefault: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ITemplateListResponse {
  items: ITemplateResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
