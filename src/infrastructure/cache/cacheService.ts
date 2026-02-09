import logger from '../../utils/logger';

// ============================================
// Cache Configuration
// ============================================

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// ============================================
// Cache Service Interface
// ============================================

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  flush(): Promise<void>;
}

// ============================================
// Memory Cache Implementation
// Time Complexity: O(1) for get/set operations
// ============================================

export class MemoryCacheService implements ICacheService {
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map();
  private readonly defaultTtl = 3600; // 1 hour

  /**
   * Get value from cache
   * Time Complexity: O(1)
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Set value in cache
   * Time Complexity: O(1)
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.defaultTtl;
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(key, { value, expiresAt });
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Delete value from cache
   * Time Complexity: O(1)
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  /**
   * Delete values matching pattern
   * Time Complexity: O(n) where n is number of cache entries
   */
  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    logger.debug(`Cache deleted ${count} entries matching: ${pattern}`);
  }

  /**
   * Flush all cache
   * Time Complexity: O(n) where n is number of cache entries
   */
  async flush(): Promise<void> {
    this.cache.clear();
    logger.info('Cache flushed');
  }
}

// ============================================
// Cache Factory
// ============================================

let cacheService: ICacheService | null = null;

export const getCacheService = (): ICacheService => {
  if (!cacheService) {
    cacheService = new MemoryCacheService();
  }
  return cacheService;
};

export const setCacheService = (service: ICacheService): void => {
  cacheService = service;
};
