import { z } from 'zod';
import { BaseSearchTool } from './base-search.tool.js';
import { MCPToolResult, MCPResourceContent } from '../../types/mcp.types.js';

const NewsSearchArgsSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(400, 'Query too long (max 400 characters)'),
  count: z.number()
    .int()
    .min(1, 'Count must be at least 1')
    .max(20, 'Count cannot exceed 20')
    .default(10),
  freshness: z.enum(['pd', 'pw', 'pm', 'py'])
    .default('pw'),
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
});

export class NewsSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'news';
  }

  get definition(): any {
    return {
      name: 'brave_news_search',
      description: 'Performs a news search using Brave Search API',
      inputSchema: NewsSearchArgsSchema,
    };
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    try {
      const validatedArgs = this.validateArgs(NewsSearchArgsSchema, args);
      const enhancedQuery = this.enhanceQuery(validatedArgs.query);
      
      const results = await this.executeWithCache(validatedArgs, async () => {
        const response = await this.braveService.newsSearch({
          q: enhancedQuery,
          count: validatedArgs.count,
          freshness: validatedArgs.freshness,
          country: validatedArgs.country
        });
        
        return response.results.map((result, index) => ({
          rank: index + 1,
          title: result.title,
          url: result.url,
          description: result.description,
          source: result.meta_url?.hostname || 'Unknown',
          published_time: result.page_age,
          image: result.thumbnail ? {
            url: result.thumbnail.src,
            dimensions: 'unknown'
          } : null,
          relevance_score: this.calculateRelevanceScore(result, enhancedQuery)
        }));
      });

      const aiResults = this.transformForAI(results, validatedArgs.query, {
        enhanced_query: enhancedQuery,
        freshness: validatedArgs.freshness
      });

      const content = aiResults.map(result => ({
        type: 'text' as const,
        text: result.text,
        mimeType: result.mimeType
      }));

      return { content };
    } catch (error) {
      return this.generateError('brave_news_search', error);
    }
  }
}
