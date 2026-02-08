/**
 * Base Path Configuration
 * Handles dynamic base path determination for API endpoints
 */

export const getBasePath = (): string => {
  // In production, use the actual base path
  // In development, use empty string for relative paths
  return process.env.NODE_ENV === 'production' 
    ? process.env.API_BASE_PATH || '' 
    : '';
};

/**
 * API Version prefix
 */
export const API_VERSION = 'v1';

/**
 * Full base URL for API
 */
export const getApiBaseUrl = (): string => {
  const basePath = getBasePath();
  const host = process.env.API_HOST || 'http://localhost:3000';
  return basePath ? `${host}${basePath}` : host;
};

export default getBasePath;
