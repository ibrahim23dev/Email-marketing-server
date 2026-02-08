/**
 * Campaigns API Endpoints Configuration
 * Enterprise-grade endpoint definitions for email marketing campaigns
 */

import { getBasePath } from './basePath';

const basePath = getBasePath();

/**
 * Main API Endpoints for Campaigns
 */
export const API_ENDPOINTS = {
  /** Campaigns endpoint - handles all CRUD operations */
  CAMPAIGNS: `${basePath}/api/campaigns`,

  /** Campaign templates endpoint */
  CAMPAIGN_TEMPLATES: `${basePath}/api/campaigns/templates`,

  /** Campaign analytics endpoint */
  CAMPAIGN_ANALYTICS: `${basePath}/api/campaigns/analytics`,

  /** Campaign audiences endpoint */
  CAMPAIGN_AUDIENCES: `${basePath}/api/campaigns/audiences`,

  /** Campaign schedule endpoint */
  CAMPAIGN_SCHEDULE: `${basePath}/api/campaigns/schedule`,

  /** Campaign sending endpoint */
  CAMPAIGN_SEND: `${basePath}/api/campaigns/send`,

  /** Campaign recipients endpoint */
  CAMPAIGN_RECIPIENTS: `${basePath}/api/campaigns/recipients`,

  /** Campaign logs endpoint */
  CAMPAIGN_LOGS: `${basePath}/api/campaigns/logs`,

  /** Campaign performance endpoint */
  CAMPAIGN_PERFORMANCE: `${basePath}/api/campaigns/performance`,

  /** Campaign validation endpoint */
  CAMPAIGN_VALIDATE: `${basePath}/api/campaigns/validate`,

  /** Campaign duplication endpoint */
  CAMPAIGN_DUPLICATE: `${basePath}/api/campaigns/duplicate`,
} as const;

/**
 * Query parameter keys for campaigns API
 */
export const CAMPAIGNS_QUERY_KEYS = {
  PAGE: 'page',
  LIMIT: 'limit',
  SEARCH: 'search',
  STATUS: 'status',
  TYPE: 'type',
  SORT_BY: 'sortBy',
  SORT_ORDER: 'sortOrder',
  START_DATE: 'startDate',
  END_DATE: 'endDate',
  TEMPLATE_ID: 'templateId',
  AUDIENCE_ID: 'audienceId',
  CAMPAIGN_ID: 'campaignId',
} as const;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

/**
 * Campaign status constants for filtering
 */
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft' as const,
  SCHEDULED: 'scheduled' as const,
  ACTIVE: 'active' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
  SENDING: 'sending' as const,
  FAILED: 'failed' as const,
} as const;

/**
 * Campaign type constants
 */
export const CAMPAIGN_TYPE = {
  NEWSLETTER: 'newsletter' as const,
  PROMOTIONAL: 'promotional' as const,
  TRANSACTIONAL: 'transactional' as const,
  WELCOME: 'welcome' as const,
  ABANDONED_CART: 'abandoned_cart' as const,
  REENGAGEMENT: 'reengagement' as const,
  ONBOARDING: 'onboarding' as const,
  EVENT_INVITATION: 'event_invitation' as const,
  SURVEY: 'survey' as const,
} as const;

/**
 * Email provider constants
 */
export const EMAIL_PROVIDER = {
  SENDGRID: 'sendgrid' as const,
  MAILGUN: 'mailgun' as const,
  SES: 'ses' as const,
  SMTP: 'smtp' as const,
  POSTMARK: 'postmark' as const,
  RESEND: 'resend' as const,
} as const;

/**
 * Campaign priority levels
 */
export const CAMPAIGN_PRIORITY = {
  LOW: 'low' as const,
  NORMAL: 'normal' as const,
  HIGH: 'high' as const,
  URGENT: 'urgent' as const,
} as const;

/**
 * Analytics event types
 */
export const ANALYTICS_EVENTS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  UNSUBSCRIBED: 'unsubscribed',
  COMPLAINED: 'complained',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Re-exports for convenience
 */
export const CAMPAIGNS_ENDPOINT = API_ENDPOINTS.CAMPAIGNS;
export const CAMPAIGN_TEMPLATES_ENDPOINT = API_ENDPOINTS.CAMPAIGN_TEMPLATES;
export const CAMPAIGN_ANALYTICS_ENDPOINT = API_ENDPOINTS.CAMPAIGN_ANALYTICS;
export const CAMPAIGN_AUDIENCES_ENDPOINT = API_ENDPOINTS.CAMPAIGN_AUDIENCES;
export const CAMPAIGN_SCHEDULE_ENDPOINT = API_ENDPOINTS.CAMPAIGN_SCHEDULE;

/**
 * Campaign validation rules
 */
export const CAMPAIGN_VALIDATION = {
  MIN_SUBJECT_LENGTH: 5,
  MAX_SUBJECT_LENGTH: 200,
  MIN_BODY_LENGTH: 10,
  MAX_RECIPIENTS: 10000,
  MIN_SCHEDULE_HOUR: 0,
  MAX_SCHEDULE_HOUR: 23,
} as const;

/**
 * Schedule frequency options
 */
export const SCHEDULE_FREQUENCY = {
  ONCE: 'once' as const,
  DAILY: 'daily' as const,
  WEEKLY: 'weekly' as const,
  MONTHLY: 'monthly' as const,
  CUSTOM: 'custom' as const,
} as const;

export default {
  API_ENDPOINTS,
  CAMPAIGNS_QUERY_KEYS,
  HTTP_METHODS,
  CAMPAIGN_STATUS,
  CAMPAIGN_TYPE,
  EMAIL_PROVIDER,
  CAMPAIGN_PRIORITY,
  ANALYTICS_EVENTS,
  PAGINATION,
  CAMPAIGN_VALIDATION,
  SCHEDULE_FREQUENCY,
};
