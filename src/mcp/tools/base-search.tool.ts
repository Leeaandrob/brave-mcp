import { z } from 'zod';
import { BraveSearchService } from '../../services/brave-search.service.js';
import { logger } from '../../utils/logger.js';
import { MCPToolResult, MCPResourceContent } from '../../types/mcp.types.js';
import { mcpConfig } from '../../config/mcp-config.js';
import { Redis } from 'ioredis';

export interface CacheEntry<T> {
  data: T;
  expiry: number;
  ttl: number;
}

export abstract class BaseSearchTool {
  protected braveService: BraveSearchService;
  protected cacheService: CacheService;
  protected queryEnhancer: QueryEnhancerService;
  
  constructor() {
    this.braveService = new BraveSearchService();
    this.cacheService = new CacheService();
    this.queryEnhancer = new QueryEnhancerService();
  }
  
  abstract get definition(): any;
  abstract get searchType(): string;
  abstract execute(args: unknown): Promise<MCPToolResult>;
  
  protected async executeWithCache<T>(
    args: Record<string, any>,
    searchFn: (args: Record<string, any>) => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    if (!mcpConfig.cache.enabled) {
      return searchFn(args);
    }
    
    let cacheKey: string = this.generateCacheKey(args);
    
    try {
      // Try memory cache first
      const memoryResult = this.cacheService.getMemoryCache<T>(cacheKey);
      if (memoryResult) {
        logger.info('Cache hit (memory)', { key: cacheKey });
        return memoryResult;
      }
      
      // Then try Redis cache
      if (this.cacheService.redisClient) {
        try {
          const redisResult = await this.cacheService.getRedisCache<T>(cacheKey);
          if (redisResult) {
            logger.info('Cache hit (redis)', { key: cacheKey });
            this.cacheService.setMemoryCache(cacheKey, redisResult, ttl);
            return redisResult;
          }
        } catch (error) {
          logger.error('Redis cache get failed', { key: cacheKey, error });
          // If Redis fails, continue without it
          this.cacheService.redisClient = null;
        }
      }
      
      // Execute search if no cache hit
      const result = await searchFn(args);
      
      // Update memory cache
      this.cacheService.setMemoryCache(cacheKey, result, ttl);
      
      return result;
    } catch (error) {
      logger.error('Cache operation failed', { key: cacheKey, error });
      // Fallback to direct search if cache is failing
      return searchFn(args);
    }
  }
  
  protected enhanceQuery(query: string): string {
    return this.queryEnhancer.enhance(query, this.searchType);
  }
  
  protected generateCacheKey(args: Record<string, any>): string {
    const sortedArgs = Object.keys(args)
      .sort()
      .reduce((result, key) => {
        result[key] = args[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${this.searchType}:${JSON.stringify(sortedArgs)}`;
  }
  
  protected transformForAI(
    results: any[], 
    query: string, 
    metadata: Record<string, any> = {}
  ): MCPResourceContent[] {
    return [
      {
        uri: `brave://${this.searchType}-search`,
        mimeType: 'application/json',
        text: JSON.stringify({
          query,
          search_type: this.searchType,
          total_results: results.length,
          results_count: results.length,
          search_metadata: {
            timestamp: new Date().toISOString(),
            search_engine: 'brave',
            api_version: mcpConfig.server.version,
            ...metadata
          },
          results
        }, null, 2)
      }
    ];
  }
  
  protected validateArgs<T>(schema: z.ZodSchema<T>, args: unknown): T {
    try {
      return schema.parse(args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }
  
  protected calculateRelevanceScore(result: any, query: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    const titleMatches = queryTerms.filter(term => 
      result.title?.toLowerCase().includes(term) || 
      result.name?.toLowerCase().includes(term)
    ).length;
    
    const descMatches = queryTerms.filter(term => 
      result.description?.toLowerCase().includes(term) || 
      result.text?.toLowerCase().includes(term)
    ).length;
    
    return Math.min(1.0, (titleMatches * 0.6 + descMatches * 0.4) / queryTerms.length);
  }
  
  protected generateError(toolName: string, error: unknown): MCPToolResult {
    if (error instanceof z.ZodError) {
      logger.error(`Validation failed for ${toolName}`, error);
      return {
        content: [],
        isError: true
      };
    }
    
    if (error instanceof Error) {
      logger.error(`Tool ${toolName} execution failed`, error);
      return {
        content: [],
        isError: true
      };
    }
    
    logger.error(`Tool ${toolName} execution failed`, error);
    return {
      content: [],
      isError: true
    };
  }
}

// Query enhancement service
export class QueryEnhancerService {
  private static readonly ENHANCEMENT_RULES = {
    web: {
      keywords: ['latest', 'guide', 'tutorial', 'review'],
      filters: ['site:reddit.com', 'site:stackoverflow.com']
    },
    news: {
      keywords: ['breaking', 'latest', 'recent', 'today'],
      filters: ['after:2024-01-01']
    },
    images: {
      keywords: ['high quality', 'HD', 'professional'],
      filters: ['filetype:jpg', 'filetype:png']
    },
    videos: {
      keywords: ['tutorial', 'explanation', 'demo'],
      filters: ['duration:medium', 'quality:high']
    }
  };
  
  enhance(query: string, searchType: string): string {
    const rules = QueryEnhancerService.ENHANCEMENT_RULES[searchType as keyof typeof QueryEnhancerService.ENHANCEMENT_RULES];
    if (!rules) return query;
    
    // Detect if query already contains enhancement keywords
    const hasEnhancement = rules.keywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasEnhancement) return query;
    
    // Add contextual enhancement based on query analysis
    const enhancement = this.selectBestEnhancement(query, rules);
    return enhancement ? `${query} ${enhancement}` : query;
  }
  
  private selectBestEnhancement(query: string, rules: any): string {
    // Implement intelligent enhancement selection logic
    // This could use ML models or rule-based systems
    return rules.keywords[0]; // Simplified implementation
  }
}

// Cache service
export class CacheService {
  private memoryCache: Map<string, CacheEntry<any>>;
  public redisClient: Redis | null;
  private readonly maxMemoryEntries = 1000;
  
  constructor() {
    this.memoryCache = new Map();
    if (mcpConfig.redis?.url) {
      try {
        this.redisClient = new Redis(mcpConfig.redis.url);
      } catch (error) {
        logger.error('Failed to connect to Redis', error);
        this.redisClient = null;
      }
    } else {
      this.redisClient = null;
    }
  }
  
  getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  async getRedisCache<T>(key: string): Promise<T | null> {
    if (!this.redisClient) return null;
    
    try {
      const result = await this.redisClient.get(key);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      logger.error('Redis get failed', { key, error });
      this.redisClient = null; // Disable Redis on error
    }
    return null;
  }
  
  setMemoryCache<T>(key: string, value: T, ttl: number): void {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000),
      ttl
    });
  }
  
  async setRedisCache<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis set failed', { key, error });
      this.redisClient = null; // Disable Redis on error
    }
  }
}