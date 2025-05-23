import { z } from 'zod';
import { BaseSearchTool } from './base-search.tool.js';
import { MCPToolResult, MCPResourceContent } from '../../types/mcp.types.js';

const WebSearchArgsSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(400, 'Query too long (max 400 characters)'),
  count: z.number()
    .int()
    .min(1, 'Count must be at least 1')
    .max(20, 'Count cannot exceed 20')
    .default(10),
  offset: z.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .max(9, 'Offset cannot exceed 9')
    .default(0),
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional(),
  safe_search: z.boolean().default(true)
});

export class WebSearchTool extends BaseSearchTool {
  get searchType(): string {
    return 'web';
  }

  get definition(): any {
    return {
      name: 'brave_web_search',
      description: 'Performs a web search using Brave Search API',
      inputSchema: WebSearchArgsSchema,
    };
  }

  async execute(args: unknown): Promise<MCPToolResult> {
    try {
      const validatedArgs = this.validateArgs(WebSearchArgsSchema, args);
      const enhancedQuery = this.enhanceQuery(validatedArgs.query);
      
      const results = await this.executeWithCache(validatedArgs, async () => {
        const response = await this.braveService.webSearch({
          q: enhancedQuery,
          count: validatedArgs.count,
          offset: validatedArgs.offset || 0, // Default to 0 if undefined
          country: validatedArgs.country,
          safesearch: validatedArgs.safe_search ? 'strict' : 'off'
        });
        
        return response.web.results.map((result, index) => ({
          rank: (validatedArgs.offset || 0) + index + 1,
          title: result.title,
          url: result.url,
          description: result.description,
          metadata: {
            age: result.age,
            language: result.language,
            family_friendly: result.familyFriendly,
            relevance_score: this.calculateRelevanceScore(result, enhancedQuery)
          }
        }));
      });

      const aiResults = this.transformForAI(results, validatedArgs.query, {
        enhanced_query: enhancedQuery
      });

      // Map MCPResourceContent to the expected format
      const content = aiResults.map(result => ({
        type: 'text' as const,
        text: result.text,
        mimeType: result.mimeType
      }));

      return { content };
    } catch (error) {
      return this.generateError('brave_web_search', error);
    }
  }
}
